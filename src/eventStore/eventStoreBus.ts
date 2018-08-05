import {Bus, IEventBus, EventSubscriptionCallback, JsonizableInterface, Constructable} from '../index';
import {EventStoreConnectionOptions, IDecodedSerializedEventstoreEvent, IEventFactory, IEventstoreEvent} from './interfaces';
import * as eventstore from 'geteventstore-promise';
import * as backoff from 'backoff';
/*
 Missing things here:
 - The injection and ussage (in proccessEvents()) of factories
 - The Refactor for extracting pattern
 - To not accept an event type without factory
 - Think in how to raise error of "NoEventFactoryFound"
 	- Add a default factory?
 - Remove any! Maybe creating my own interface for it?
 - TESTS
 - Actually USE THE BUS! All this code should be a middleware
 - EventType must be serializable
*/
class EventStoreBusConnector<T extends IEventstoreEvent = IEventstoreEvent> implements IEventBus<T> {

	bus: Bus<T> = new Bus();
	publisher = this.bus.createPublisher();
	connectionOptions: EventStoreConnectionOptions;
	eventFactories: Map<string, IEventFactory<T>> = new Map();
	backoffStrategy: backoff.Backoff;

	client: any;
	streamName: string;
	startPosition: number = 0;
	messagesToGet = 100;

	constructor(connectionOptions: EventStoreConnectionOptions, streamName: string, startPosition: number = 0) {
		this.connectionOptions = connectionOptions;
		this.startPosition = startPosition;
		this.streamName = streamName;

		this.client = this.connect(this.connectionOptions);
		this.backoffStrategy = createBackoff();

		this.declareConsumers();
		this.backoffStrategy.backoff();
	}

	public async publish(event: T): Promise<void> {
		// TODO: Serialize message and send to eventstore
	}

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void {
		return this.bus.on(eventType, callback);
	}

	protected connect(options: EventStoreConnectionOptions): any {
		return eventstore.http({
			hostname: this.connectionOptions.hostname,
			port: this.connectionOptions.port,
			credentials: {
				username: this.connectionOptions.credentials.username,
				password: this.connectionOptions.credentials.password,
			},
		});
	}

	private declareConsumers(): void {
		this.backoffStrategy.on('backoff', (number, delay) => {
			this.client.getEvents(this.streamName, this.startPosition, this.messagesToGet)
			.then((events: Array<IDecodedSerializedEventstoreEvent>) => this.processConsumeAnswer(events))
			.catch((error: any) => {
				return this.backoffStrategy.backoff(error);
			});
		});

		this.backoffStrategy.on('fail', (error: unknown) => {
			this.logError(error);
		});
	}

	protected processConsumeAnswer(events: Array<IDecodedSerializedEventstoreEvent>) {
		if (events.length === 0) {
			return this.backoffStrategy.backoff();
		}

		return this.processEvents(events)
		.then(() => {
			this.startPosition += this.messagesToGet;
			this.backoffStrategy.reset();
			this.backoffStrategy.backoff();
		})
		.catch((error: any) => {
			return this.backoffStrategy.backoff(error);
		});
	}

	public addEventType(event: Constructable<T>, factory: IEventFactory<T>): void {
		this.eventFactories.set(factory.getEventType(), factory);
	}

	protected processEvents(events: Array<IDecodedSerializedEventstoreEvent>): Promise<void> {
		for (const event of events) {
			const eventFactory = this.eventFactories.get(event.eventType);

			if (!eventFactory) {
				this.logError(new EventFactoryNotFoundError());
				continue;
			}

			let eventObject = null;

			try {
				eventObject = eventFactory.build(event);
			} catch (error) {
				this.logError(error);
				continue;
			}

			this.publisher.publish(eventObject);
		}

		return Promise.resolve();
	}

	protected logError(error: unknown): void {
		// TODO: Implement
	}
}

function createBackoff(): backoff.Backoff {
	return backoff.fibonacci({
		randomisationFactor: 0,
		initialDelay: 300,
		maxDelay: 7000,
	});
}

export class EventFactoryNotFoundError extends Error {
	constructor() {
		super();
		this.stack = (new Error()).stack;
		this.message = 'Event Factory not found';
	}
}
