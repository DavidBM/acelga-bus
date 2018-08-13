import {Backoff} from 'backoff';
import {IDecodedSerializedEventstoreEvent, ErrorLogger} from './interfaces'

type Handler = (events: Array<IDecodedSerializedEventstoreEvent>) => Promise<number>;

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
		return this.client.writeEvent(this.streamName, eventType, event); //Asuming good serialization
	}

	private declareConsumers(): void {

		this.backoffStrategy.on('backoff', (number, delay) => {

			this.client.getEvents(this.streamName, this.startPosition, this.messagesToGet)
			.then((events: Array<IDecodedSerializedEventstoreEvent>) => {
				return this.processConsumedAnswer(events)
			})
			.catch((error: any) => {
				return this.backoffStrategy.backoff(error)
			});
		});

		this.backoffStrategy.on('fail', (error: unknown) => {
			this.logError(error);
		});
	}

	protected processConsumedAnswer(events: Array<IDecodedSerializedEventstoreEvent>) {
		if (events.length === 0) {
			return this.backoffStrategy.backoff();
		}

		if(!this.handler)
			return this.logError();

		return this.handler(events)
		.then((mesagesGot) => {
			this.startPosition += mesagesGot;
			this.backoffStrategy.reset();
			this.backoffStrategy.backoff();
		});
	}
}

export class NoHanlderToProcessEvents extends Error {
	events: any;

	constructor(events: any) {
		super();
		this.stack = (new Error()).stack;
		this.events = events;
		this.message = 'The handler for processing events is still not set. The non-processed events are stored in attribute "events" of this error object';
	}
}
