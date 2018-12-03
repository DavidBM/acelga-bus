import {Constructable, BulkDispatcher, ErrorLogger, ExecutionResult, EventFactoryRespository} from '../index';
import {DecodedSerializedEventstoreEvent, IEventFactory, IEventstoreEvent, IEventstoreEventReceived, originalEventSymbol} from './interfaces';
import {EventstoreClient} from './client';
import {iterate} from 'iterated-pipes';

const PARALLEL_FEEDBACK = 5;
enum FEEDBACK_ACTION {
	nack = 'nack',
	ack = 'ack',
}

type ReceivedEvents<T> = T & IEventstoreEventReceived;
type EventRepository<T extends IEventstoreEvent> = EventFactoryRespository<T, DecodedSerializedEventstoreEvent>;

export class EventProcessor<T extends IEventstoreEvent> {

	constructor(
		private eventRepository: EventRepository<T>,
		private logError: ErrorLogger,
		private dispatcher: BulkDispatcher<T>,
		private client: EventstoreClient,
	) {
		this.client.setHandler(events => this.processEvents(events));
	}

	public addEventType(event: Constructable<T>, factory: IEventFactory<T>): void {
		const eventType = event.name;
		this.eventRepository.set(eventType, factory);
	}

	// This is not a middleware because the type system would not allow that.
	// We must ensure that everything in middlewares are events, nothing more.
	public async processEvents(events: DecodedSerializedEventstoreEvent[]): Promise<void> {
		const eventInstances: Array<ReceivedEvents<T>> = [];

		try {

			for (const event of events){
				try {
					const decodedEvent = await this.eventRepository.execute(event) as ReceivedEvents<T>;
					decodedEvent[originalEventSymbol] = event;

					eventInstances.push(decodedEvent);
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
			this.logError(new EventWithoutACKLinks(event, originalEvent));
		}
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

export class EventWithoutACKLinks<T> extends Error {
	event: T;
	originalEvent: DecodedSerializedEventstoreEvent;

	constructor(event: T, originalEvent: DecodedSerializedEventstoreEvent) {
		super();
		this.event = event;
		this.originalEvent = originalEvent;
		this.message = 'The nack or ack links in the event were not found. event & originalDecodedEvent are attached in this error.';
	}
}
