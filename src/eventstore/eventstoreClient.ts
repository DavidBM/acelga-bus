import {BackoffExecutor} from './backoff';
import {HTTPClient, EmbedType} from 'geteventstore-promise';
import {IDecodedSerializedEventstoreEvent, EventstoreFeedbackHTTP} from './interfaces';
import {ErrorLogger} from '../index';
import {decodeEventstoreResponse} from './eventstoreUtils';

const NO_MESSAGES = Symbol('no messages');

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
	signal: EventstoreFeedbackHTTP;

	constructor(client: HTTPClient, signalInterface: EventstoreFeedbackHTTP, errorLogger: ErrorLogger, backoffStrategy: BackoffExecutor, subscriptions: Array<SubscriptionDefinition>) {
		this.client = client;
		this.backoffStrategy = backoffStrategy;
		this.logError = errorLogger;
		this.signal = signalInterface;

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
				if(error === NO_MESSAGES)
					return continuing();

				this.logError(error);
				restarting();
			})
		});
	}

	async ack(url: string): Promise<void> {
		await this.signal(url);
	}

	async nack(url: string): Promise<void> {
		await this.signal(url);
	}

	protected async processConsumedAnswer(events: Array<IDecodedSerializedEventstoreEvent>): Promise<void> {
		if (!Array.isArray(events) || events.length === 0) {
			return await Promise.reject(NO_MESSAGES);
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
