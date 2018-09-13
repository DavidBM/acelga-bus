import {IEventBus, EventSubscriptionCallback, Constructable, BulkDispatcher, ErrorLogger, ExecutionError} from '../index';
import {IDecodedSerializedEventstoreEvent, IEventFactory, IEventstoreEvent} from './interfaces';
import {EventFactoryRespository as Repository} from './factoryRepository';
import {EventstoreClient} from './eventstoreClient';

/*
 TODO:
   _______ ______  _____ _______   __  __ _____  _____ _____ _____ _   _  _____
 |__   __|  ____|/ ____|__   __| |  \/  |_   _|/ ____/ ____|_   _| \ | |/ ____|
    | |  | |__  | (___    | |    | \  / | | | | (___| (___   | | |  \| | |  __
    | |  |  __|  \___ \   | |    | |\/| | | |  \___ \\___ \  | | | . ` | | |_ |
    | |  | |____ ____) |  | |    | |  | |_| |_ ____) |___) |_| |_| |\  | |__| |
    |_|  |______|_____/   |_|    |_|  |_|_____|_____/_____/|_____|_| \_|\_____|
           (I think that it enough clear I need to do test of this folder.)

 - Move to subscriptions of EventStore instead of reading streams. The Bus doesn't need to keep the count of messagess
 - Use persistent subscriptions
 - The subscription should ask for some kind of:
 	A) If it is a stream, a function where the user can store the received messages
 	B) IF it is a subscription, the function should ask the name of the subscription.
 - Reorganize the intefaces to be in the correct files. Parent files must reexport interfaces if required. C
   reate a d.ts for files in order to have them in different files without importer the concrete implementation
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
		return this.client.publish(event.aggregate, eventType, event);
	}

	public addEventType(event: Constructable<T>, factory: IEventFactory<T>): void {
		const eventType = event.constructor.name;
		this.eventRepository.set(eventType, factory);
	}

	// This is not a middleware because the type system would not allow that.
	// We must ensure that everything in middlewares are events, nothing more.
	protected async processEvents(events: IDecodedSerializedEventstoreEvent[]): Promise<void> {
		const eventInstances: T[] = [];

		for (const event of events){
			try {
				eventInstances.push(await this.eventRepository.execute(event));
			} catch (error) {
				return this.logError(error);
			}
		}

		await this.dispatcher.trigger(eventInstances)
		.then(errors => this.processErrors(errors)) // Events to retry or to discard
		.catch(error => { // Internal error, events may be not delivered. Use errorLogger
			// TODO: Log internal error
			// TODO: NO-ACK all events
		});
	}

	protected processErrors(errors: ExecutionError<T>[]): void {
		if (!Array.isArray(errors) || errors.length === 0)
			return ; // TODO: ACK all events

		// TODO. NO-ACK errors & ACK rest of events
	}
}

export class EventAlreadySubscribed<T> extends Error {
	eventType: Constructable<T>;

	constructor(eventType: Constructable<T>) {
		super();
		this.eventType = eventType;
		this.message = 'The Event you want to subscribe already has one subscription. Only one subscription is allowed in order to keep processing simple to reason about. If you want to do that for sure, please, create a new Bus instance.';
	}
}
