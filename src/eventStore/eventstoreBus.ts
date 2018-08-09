import {Backoff} from 'backoff';

import {IEventBus, EventSubscriptionCallback, Constructable, Receiver} from '../index';
import {IDecodedSerializedEventstoreEvent, IEventFactory, IEventstoreEvent, ErrorLogger} from './interfaces';
import {EventFactoryRespository as Repository} from './factoryRepository';

/*
 Missing things here:
 - TESTS
 - Change type receiver to Dispatcher
*/
export class EventStoreBus<T extends IEventstoreEvent = IEventstoreEvent> implements IEventBus<T> {

	dispatcher: Receiver<T> = new Receiver();
	logError: (...args: any[]) => void;

	eventRepository: Repository<T>;
	backoffStrategy: Backoff;

	client: any;
	streamName: string;
	startPosition: number = 0;
	messagesToGet = 100;

	constructor(client: any, backoffStrategy: Backoff, errorLogger: ErrorLogger, eventRepository: Repository<T>, streamName: string, startPosition: number = 0) {
		this.client = client;
		this.backoffStrategy = backoffStrategy;
		this.eventRepository = eventRepository;
		this.logError = errorLogger;

		this.startPosition = startPosition;
		this.streamName = streamName;

		this.declareConsumers();
		this.backoffStrategy.backoff();
	}

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void {
		return this.dispatcher.on(eventType, callback);
	}

	public onAny(callback: EventSubscriptionCallback<T>): void {
		this.dispatcher.onAny(callback);
	}

	public async publish(event: T): Promise<void> {
		const eventType = event.constructor.name;
		return this.client.writeEvent(this.streamName, eventType, event); //Asuming good serialization
	}

	public addEventType(event: Constructable<T>, factory: IEventFactory<T>): void {
		const eventType = event.constructor.name;
		this.eventRepository.set(eventType, factory);
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

		return this.processEvents(events)
		.then((mesagesGot) => {
			this.startPosition += mesagesGot;
			this.backoffStrategy.reset();
			this.backoffStrategy.backoff();
		});
	}

	protected processEvents(events: Array<IDecodedSerializedEventstoreEvent>): Promise<number> {
		for (const event of events) {
			let eventObject = null;

			try {
				eventObject = this.eventRepository.execute(event);
			} catch (error) {
				this.logError(error);
				continue;
			}

			this.dispatcher.trigger(eventObject);
		}

		return Promise.resolve(events.length);
	}
}
