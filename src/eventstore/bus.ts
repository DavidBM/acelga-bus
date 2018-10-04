import {IEventBus, EventSubscriptionCallback, Constructable, BulkDispatcher, ErrorLogger, ExecutionResult} from '../index';
import {IDecodedSerializedEventstoreEvent, IEventFactory, IEventstoreEvent, IEventstoreEventReceived, originalEventSymbol} from './interfaces';
import {EventFactoryRespository} from './factoryRepository';
import {EventstoreClient} from './client';
import {iterate} from 'iterated-pipes';

const PARALLEL_FEEDBACK = 5;
enum FEEDBACK_ACTION {
	nack = 'nack',
	ack = 'ack',
}

type ReceivedEvents<T> = T & IEventstoreEventReceived;

/*
 - Reorganize the interfaces to be in the correct files. Parent files must reexport interfaces if required.
   Create a d.ts for files in order to have them in different files without importer the concrete implementation
 - Research about how to know if a message was no ack before
*/
export class EventStoreBus<T extends IEventstoreEvent = IEventstoreEvent> implements IEventBus<T> {

	protected dispatcher: BulkDispatcher<T>;
	protected logError: ErrorLogger;

	protected eventRepository: EventFactoryRespository<T>;
	protected client: EventstoreClient;

	constructor(client: EventstoreClient, errorLogger: ErrorLogger, eventRepository: EventFactoryRespository<T>, dispatcher: BulkDispatcher<T>) {
		this.client = client;
		this.eventRepository = eventRepository;
		this.logError = errorLogger;
		this.dispatcher = dispatcher;

		this.client.setHandler((events) => this.processEvents(events));
	}

	public startConsumption() {
		return this.client.ping()
		.then(() => this.client.startConsumption());
	}

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1 & IEventstoreEventReceived> ): void {
		if (this.dispatcher.isListened(eventType)) {
			throw new EventAlreadySubscribed<T>(eventType);
		}
		// We are returning extra data in the events
		return this.dispatcher.on(eventType, callback as EventSubscriptionCallback<T1>);
	}

	public stop(): Promise<void> {
		return this.client.stop();
	}

	public onAny(callback: EventSubscriptionCallback<T>): void {
		this.dispatcher.onAny(callback);
	}

	public async publish(event: T): Promise<void> {
		const eventType = event.constructor.name;
		return this.client.publish(event.aggregate, eventType, event);
	}

	public addEventType(event: Constructable<T>, factory: IEventFactory<T>): void {
		const eventType = event.name;
		this.eventRepository.set(eventType, factory);
	}

	// This is not a middleware because the type system would not allow that.
	// We must ensure that everything in middlewares are events, nothing more.
	protected async processEvents(events: IDecodedSerializedEventstoreEvent[]): Promise<void> {
		const eventInstances: Array<ReceivedEvents<T>> = [];

		try {

			for (const event of events){
				try {
					const decodedEvent = await this.eventRepository.execute(event) as ReceivedEvents<T>;
					decodedEvent[originalEventSymbol] = event;

					eventInstances.push(decodedEvent); // T + IEventstoreEventReceived
				} catch (error) {
					this.logError(error);
				}
			}

			const errors = await this.dispatcher.trigger(eventInstances);
			await this.processErrors(errors);
		} catch (error) {
			this.logError(new InternalErrorNOACKAll(error));

			return iterate(eventInstances)
			.parallel(PARALLEL_FEEDBACK, event => this.giveEventFeedback(event, FEEDBACK_ACTION.nack));
		}
	}

	protected async processErrors(results: ExecutionResult<ReceivedEvents<T>>[]): Promise<void> {
		return iterate(results)
		.parallel(PARALLEL_FEEDBACK, result => {

			let action = FEEDBACK_ACTION.ack;
			if (result.isError)
				action = FEEDBACK_ACTION.nack;

			return this.giveEventFeedback(result.event, action);
		});
	}

	protected async giveEventFeedback(event: IEventstoreEventReceived, action: FEEDBACK_ACTION): Promise<void> {
		const originalEvent = event[originalEventSymbol];

		if (originalEvent && originalEvent[action]){
			await this.client[action](originalEvent[action])
			.catch(error => this.logError(error));
		} else {
			this.logError(new EventWithoutACKLiks(event, originalEvent));
		}
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

export class InternalErrorNOACKAll extends Error {
	originalError: any;

	constructor(originalError: any) {
		super();
		this.originalError = originalError;
		this.message = 'There was an internal error in the library. All event are going to be nack. The original error is attached in the "originalError" attribute in this error.';
	}
}

export class EventWithoutACKLiks<T> extends Error {
	event: T;
	originalEvent: IDecodedSerializedEventstoreEvent

	constructor(event: T, originalEvent: IDecodedSerializedEventstoreEvent) {
		super();
		this.event = event;
		this.originalEvent = originalEvent;
		this.message = 'The nack or ack links in the event were not found. event & originalDecodedEvent are attached in this error.';
	}
}
