import {IEventBus, EventSubscriptionCallback, Constructable, BulkDispatcher, ErrorLogger} from '../index';
import {IDecodedSerializedEventstoreEvent, IEventFactory, IEventstoreEvent} from './interfaces';
import {EventFactoryRespository as Repository} from './factoryRepository';
import {EventstoreClient} from './eventstoreConsumer';

/*
 TODO:
 - TESTS
 - Move to subscriptions of EventStore instead of reading streams. The Bus doesn't need to keep the count of messagess
 - Use persistent subscriptions
*/
export class EventStoreBus<T extends IEventstoreEvent = IEventstoreEvent> implements IEventBus<T> {

	dispatcher: BulkDispatcher<T>;
	logError: ErrorLogger;

	eventRepository: Repository<T>;
	client: EventstoreClient;

	constructor(client: EventstoreClient, errorLogger: ErrorLogger, eventRepository: Repository<T>, dispatcher: BulkDispatcher<T>) {
		this.client = client;
		this.eventRepository = eventRepository;
		this.logError = errorLogger;
		this.dispatcher = dispatcher;

		this.client.setHandler((events) => this.processEvents(events));
	}

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void {
		if (this.dispatcher.isListened(eventType)) {
			throw new EventAlreadySubscribed(eventType);
		}
		return this.dispatcher.on(eventType, callback);
	}

	public onAny(callback: EventSubscriptionCallback<T>): void {
		this.dispatcher.onAny(callback);
	}

	public async publish(event: T): Promise<void> {
		const eventType = event.constructor.name;
		return this.client.publish(eventType, event);
	}

	public addEventType(event: Constructable<T>, factory: IEventFactory<T>): void {
		const eventType = event.constructor.name;
		this.eventRepository.set(eventType, factory);
	}

	// This is not a middleware because the type system would not allow that.
	// We must ensure that everything in middlewares are events, nothing more.
	protected async processEvents(events: IDecodedSerializedEventstoreEvent[]): Promise<void> {
		let eventInstances = [];

		for(const event of events){
			try {
				eventInstances.push(await this.eventRepository.execute(event));
			} catch (error) {
				return this.logError(error);
			}
		}

		this.dispatcher.trigger(eventInstances)
		.then() // TODO: Events to retry or to discard
		.catch(); // TODO: Internal error, events may be not delivered. Use errorLogger
	}
}

export class EventAlreadySubscribed<T> extends Error {
	eventType: Constructable<T>

	constructor(eventType: Constructable<T>) {
		super();
		this.eventType = eventType;
		this.message = 'The Event you want to subscribe already has one subscription. Only one subscription is allowed in order to keep processing simple to reason about. If you want to do that for sure, please, create a new Bus instance.';
	}
}