import {BackoffExecutor} from './backoff';
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
	backoffStrategy: BackoffExecutor;
	messagesToGet = 100;
	handler: null | Handler = null;
	logError: ErrorLogger;

	constructor(client: HTTPClient, errorLogger: ErrorLogger, backoffStrategy: BackoffExecutor, subscriptions: Array<SubscriptionDefinition>) {
		this.client = client;
		this.backoffStrategy = backoffStrategy;
		this.logError = errorLogger;

		subscriptions.forEach(config => this.declareConsumers(config.subscription, config.stream));
	}

	public setHandler(handler: Handler) {
		this.handler = handler;
	}

	public async publish(streamName: string, eventType: string, event: {}): Promise<void> {
		return this.client.writeEvent(streamName, eventType, event); // Asuming good serialization
	}

	private declareConsumers(subscriptionName: string, streamName: string): void {
		this.backoffStrategy((continuing, restarting, number, delay) => {
			this.client.persistentSubscriptions.getEvents(subscriptionName, streamName, this.messagesToGet, 'body')
			.then((response) => decodeEventstoreResponse(response))
			.then((events) => this.processConsumedAnswer(events))
			.then(() => restarting())
			.catch((error) => {
				if(!error)
					return continuing();

				this.logError(error);
				restarting();
			})
		});
	}

	protected async processConsumedAnswer(events: Array<IDecodedSerializedEventstoreEvent>): Promise<void> {
		if (!Array.isArray(events) || events.length === 0) {
			return await Promise.reject();
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
