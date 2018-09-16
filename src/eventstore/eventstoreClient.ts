import {Backoff} from 'backoff';
import {HTTPClient, EmbedType} from 'geteventstore-promise';
import {IDecodedSerializedEventstoreEvent} from './interfaces';
import {ErrorLogger} from '../index';
import {decodeEventstoreResponse} from './eventstoreUtils';

type Handler = (events: IDecodedSerializedEventstoreEvent[]) => Promise<void>;
export interface SubscriptionDefinition {
	stream: string;
	subscription: string;
}

export class EventstoreClient {
	client: HTTPClient;
	backoffStrategy: Backoff;
	messagesToGet = 100;
	handler: null | Handler = null;
	logError: ErrorLogger;

	constructor(client: HTTPClient, errorLogger: ErrorLogger, backoffStrategy: Backoff, subscriptions: Array<SubscriptionDefinition>) {
		this.client = client;
		this.backoffStrategy = backoffStrategy;
		this.logError = errorLogger;

		subscriptions.forEach(config => this.declareConsumers(config.subscription, config.stream));
		this.backoffStrategy.backoff();
	}

	public setHandler(handler: Handler) {
		this.handler = handler;
	}

	public async publish(streamName: string, eventType: string, event: {}): Promise<void> {
		return this.client.writeEvent(streamName, eventType, event); // Asuming good serialization
	}

	private declareConsumers(subscriptionName: string, streamName: string): void {

		this.backoffStrategy.on('backoff', (number, delay) => {
			return this.client.persistentSubscriptions.getEvents(subscriptionName, streamName, this.messagesToGet, 'Body')
			.then((response) => decodeEventstoreResponse(response))
			.then((events) => {
				return this.processConsumedAnswer(events);
			})
			.catch((error) => {
				this.logError(error);
				throw error;
			});
		});

		this.backoffStrategy.on('ready', () => {
			this.backoffStrategy.reset();
			this.backoffStrategy.backoff();
		});

		this.backoffStrategy.on('fail', (error: unknown) => {
			this.logError(error);
			this.backoffStrategy.backoff();
		});
	}

	protected async processConsumedAnswer(events: Array<IDecodedSerializedEventstoreEvent>): Promise<void> {
		if (!Array.isArray(events) || events.length === 0) {
			return Promise.reject();
		}

		await this.processEvents(events);
	}

	protected async processEvents(events: Array<IDecodedSerializedEventstoreEvent>): Promise<void> {
		if (!this.handler){
			return this.logError(new NoHanlderToProcessEvents(events));
		}

		await this.handler(events);
	}
}

export class NoHanlderToProcessEvents extends Error {
	events: any;

	constructor(events: any) {
		super();
		this.events = events;
		this.message = 'The handler for processing events is still not set. The non-processed events are stored in attribute "events" of this error object';
	}
}
