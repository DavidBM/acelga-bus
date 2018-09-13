import {Backoff} from 'backoff';
import {IDecodedSerializedEventstoreEvent} from './interfaces';
import {ErrorLogger} from '../index';

type Handler = (events: IDecodedSerializedEventstoreEvent[]) => Promise<void>;
export type SubscriptionDefinition = {stream: string, subscription: string};

export class EventstoreClient {
	client: any;
	backoffStrategy: Backoff;
	messagesToGet = 100;
	handler: null | Handler = null;
	logError: ErrorLogger;

	constructor(client: any, errorLogger: ErrorLogger, backoffStrategy: Backoff, subscriptions: Array<SubscriptionDefinition>) {
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

		this.backoffStrategy.on('backoff', (number, delay) => {

			return this.client.persistentSubscriptions.getEvents(subscriptionName, streamName, this.messagesToGet, 'Body')
			.then((events: Array<IDecodedSerializedEventstoreEvent>) => {
				return this.processConsumedAnswer(events);
			})
			.catch((error: any) => {
				return this.backoffStrategy.backoff(error);
			});
		});

		this.backoffStrategy.on('fail', (error: unknown) => {
			this.logError(error);
		});
	}

	protected async processConsumedAnswer(events: Array<IDecodedSerializedEventstoreEvent>): Promise<void> {
		if (events.length === 0) {
			return this.backoffStrategy.backoff();
		}

		await this.processEvents(events);
		this.backoffStrategy.reset();
		this.backoffStrategy.backoff();
	}

	protected async processEvents(events: Array<IDecodedSerializedEventstoreEvent>): Promise<void> {
		if (!this.handler){
			return this.logError(new NoHanlderToProcessEvents(events));
		}

		this.handler(events);
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
