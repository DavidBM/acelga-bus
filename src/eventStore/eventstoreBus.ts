import {IEventBus, EventSubscriptionCallback, Constructable, Receiver} from '../index';
import {IDecodedSerializedEventstoreEvent, IEventFactory, IEventstoreEvent, ErrorLogger} from './interfaces';
import {EventFactoryRespository as Repository} from './factoryRepository';
import {EventstoreClient} from './eventstoreConsumer';

/*
 Missing things here:
 - TESTS
 - Change type receiver to Dispatcher
*/
export class EventStoreBus<T extends IEventstoreEvent = IEventstoreEvent> implements IEventBus<T> {

	dispatcher: Receiver<T> = new Receiver();
	logError: ErrorLogger;

	eventRepository: Repository<T>;
	client: EventstoreClient;

	constructor(client: EventstoreClient, errorLogger: ErrorLogger, eventRepository: Repository<T>) {
		this.eventRepository = eventRepository;
		this.logError = errorLogger;
		this.client = client;

		this.client.setHandler((events) => this.processEvents(events));
	}

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void {
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
