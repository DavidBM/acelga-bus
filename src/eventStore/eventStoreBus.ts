import {Backoff} from 'backoff';
import {IEventBus, EventSubscriptionCallback, Constructable, Publisher, Receiver} from '../index';
import {IDecodedSerializedEventstoreEvent, IEventFactory, IEventstoreEvent} from './interfaces';
import {EventFactoryRespository as Repository} from './factoryRepository';

/*
 Missing things here:
 - Think in how to raise error of "NoEventFactoryFound"
 	- Add a default factory?
 - Remove any! Maybe creating my own interface for it?
 - TESTS
 - Maybe move thngs to interfaces
 - Support subscription to all or to pattern(?) (In receiver)
*/
export class EventStoreBus<T extends IEventstoreEvent = IEventstoreEvent> implements IEventBus<T> {

	publisher: Publisher<T> = new Publisher((item: T) => this.deliver(item));
	receivers: Receiver<T>[] = [];
	defaultReceiver: Receiver<T> = new Receiver();

	eventRepository: Repository<T>;
	backoffStrategy: Backoff;

	client: any;
	streamName: string;
	startPosition: number = 0;
	messagesToGet = 100;

	constructor(client: any, backoffStrategy: Backoff, eventRepository: Repository<T>, streamName: string, startPosition: number = 0) {
		this.client = client;
		this.backoffStrategy = backoffStrategy;
		this.eventRepository = eventRepository;

		this.startPosition = startPosition;
		this.streamName = streamName;

		this.declareConsumers();
		this.backoffStrategy.backoff();
	}

	protected deliver(event: T): Promise<void> {
		return Promise.all(this.receivers.map(receiver => receiver.trigger(event)))
		.then(() => {});
	}

	public async publish(event: T): Promise<any> {
		const eventType = event.constructor.name;
		return this.client.writeEvent(this.streamName, eventType, event); //Asuming good serialization
	}

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void {
		return this.defaultReceiver.on(eventType, callback);
	}

	private declareConsumers(): void {
		this.backoffStrategy.on('backoff', (number, delay) => {
			this.client.getEvents(this.streamName, this.startPosition, this.messagesToGet)
			.then((events: Array<IDecodedSerializedEventstoreEvent>) => this.processConsumeAnswer(events))
			.catch((error: any) => this.backoffStrategy.backoff(error));
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
		.then((mesagesGot) => {
			this.startPosition += mesagesGot;
			this.backoffStrategy.reset();
			this.backoffStrategy.backoff();
		});
	}

	public addEventType(event: Constructable<T>, factory: IEventFactory<T>): void {
		const eventType = event.constructor.name;
		this.eventRepository.set(eventType, factory);
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

			this.publisher.publish(eventObject);
		}

		return Promise.resolve(events.length);
	}

	protected logError(error: unknown): void {
		// TODO: Implement
	}
}
