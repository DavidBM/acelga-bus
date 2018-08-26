
import {IEventBus, EventSubscriptionCallback, Constructable, Dispatcher, ErrorLogger} from '../index';
import {IDecodedSerializedEventstoreEvent, IEventFactory, IEventstoreEvent} from './interfaces';
import {EventFactoryRespository as Repository} from './factoryRepository';
import {EventstoreClient} from './eventstoreConsumer';

/*
 TODO:
 - TESTS
 - Change type receiver to Dispatcher
 - Add Scheduler for tracking how executions are done (parallel or sequential). It should have a public interface to be ableto implement an external scheduler.
 - When decided to execute parallel, if there is more than one event in the queue, then wait for the first one to finish before execute the second. It will require to change the promise returns & code
 - Only allow one subscription for each event type. Do that as an external dependency.
 - Only one possible subcriber per event?
 - ErrorLogger needs to be async for errors in processing events
 - In case of error, can the results map back to the original array by the scheduler? Check that
 - Think about when to stop the execution and when to just log the error
 - Remove the functions for recovery of the order from the scheduler plan. They aren't used. 
*/
export class EventStoreBus<T extends IEventstoreEvent = IEventstoreEvent> implements IEventBus<T> {

	dispatcher: Dispatcher<T> = new Dispatcher();
	logError: ErrorLogger;

	eventRepository: Repository<T>;
	client: EventstoreClient;

	constructor(client: EventstoreClient, errorLogger: ErrorLogger, eventRepository: Repository<T>) {
		this.eventRepository = eventRepository;
		this.logError = errorLogger;
		this.client = client;

		this.client.setHandler((event) => this.processEvents(event));
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

	// This is not a middleware because the type system would not allow that.
	// We must ensure that everything in middlewares are events, nothing more.
	protected async processEvents(event: IDecodedSerializedEventstoreEvent): Promise<void> {
		let eventObject = null;

		try {
			eventObject = this.eventRepository.execute(event);
		} catch (error) {
			return this.logError(error);
		}

		this.dispatcher.trigger(eventObject);
	}
}
