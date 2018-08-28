import {Backoff} from 'backoff';
import {IDecodedSerializedEventstoreEvent} from './interfaces';
import {ErrorLogger} from '../index';

type Handler = (events: IDecodedSerializedEventstoreEvent[]) => Promise<void>;

export class EventstoreClient {
	client: any;
	backoffStrategy: Backoff;
	streamName: string;
	startPosition: number = 0;
	messagesToGet = 100;
	handler: null | Handler = null;
	logError: ErrorLogger;

	constructor(client: any, errorLogger: ErrorLogger, backoffStrategy: Backoff, streamName: string, startPosition: number = 0) {
		this.client = client;
		this.backoffStrategy = backoffStrategy;
		this.streamName = streamName;
		this.startPosition = startPosition;
		this.logError = errorLogger;

		this.declareConsumers();
	}

	public setHandler(handler: Handler) {
		this.handler = handler;
	}

	public async publish(eventType: string, event: {}): Promise<void> {
		return this.client.writeEvent(this.streamName, eventType, event); // Asuming good serialization
	}

	private declareConsumers(): void {

		this.backoffStrategy.on('backoff', (number, delay) => {

			return this.client.getEvents(this.streamName, this.startPosition, this.messagesToGet)
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
		this.startPosition += events.length;
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

