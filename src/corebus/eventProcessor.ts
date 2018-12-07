import {Constructable, BulkDispatcher, ErrorLogger, ExecutionResult, EventFactoryRespository} from '../index';
import {DecodedEvent, ReceivedEvent, originalEventSymbol, EventFactory, AcknowledgeableClient, Event} from '../corebus/interfaces';
import {iterate} from 'iterated-pipes';

const PARALLEL_FEEDBACK = 5;
enum FEEDBACK_ACTION {
	nack = 'nack',
	ack = 'ack',
}

type ReceivedEvents<E, R> = E & ReceivedEvent<E, R>;
type EventRepository<E, R> = EventFactoryRespository<Event<E>, DecodedEvent<R>>;

export class EventProcessor<E, R> { // E = Event data, R = Decoded original event data

	constructor(
		private eventRepository: EventRepository<E, R>,
		private logError: ErrorLogger,
		private dispatcher: BulkDispatcher<Event<E>>,
		private client: AcknowledgeableClient<R>,
	) { }

	public addEventType(event: Constructable<Event<E>>, factory: EventFactory<E, R>): void {
		const eventType = event.name;
		this.eventRepository.set(eventType, factory);
	}

	// This is not a middleware because the type system would not allow that.
	// We must ensure that everything in middlewares are events, nothing more.
	public async processEvents(events: DecodedEvent<R>[]): Promise<void> {
		const eventInstances: Array<ReceivedEvents<E, R>> = [];

		try {

			for (const event of events){
				try {
					const decodedEvent = await this.eventRepository.execute(event) as ReceivedEvents<E, R>;
					decodedEvent[originalEventSymbol] = event;

					eventInstances.push(decodedEvent);
				} catch (error) {
					this.logError(new ErrorOnEventReconstruction(event, error));
				}
			}

			const errors = await this.dispatcher.trigger(eventInstances);
			return await this.processErrors(errors);
		} catch (error) {
			this.logError(new InternalErrorNOACKAll(error));

			return iterate(eventInstances)
			.parallel(PARALLEL_FEEDBACK, event => this.giveEventFeedback(event, FEEDBACK_ACTION.nack));
		}
	}

	protected async processErrors(results: ExecutionResult<ReceivedEvents<E, R>>[]): Promise<void> {
		return iterate(results)
		.parallel(PARALLEL_FEEDBACK, result => {

			let action = FEEDBACK_ACTION.ack;
			if (result.isError)
				action = FEEDBACK_ACTION.nack;

			return this.giveEventFeedback(result.event, action);
		});
	}

	protected async giveEventFeedback(event: ReceivedEvent<E, R>, action: FEEDBACK_ACTION): Promise<void> {
		const originalEvent = event[originalEventSymbol];

		if (originalEvent){
			return await this.client[action](originalEvent)
			.catch(error => this.logError(error));
		} else {
			this.logError(new EventWithoutOriginalEvent(event, originalEvent));
		}
	}
}

export class InternalErrorNOACKAll extends Error {
	constructor(public originalError: any) {
		super();
		this.message = 'There was an internal error in the library. All event are going to be nack. The original error is attached in the "originalError" attribute in this error.';
	}
}

export class EventWithoutOriginalEvent<E, R> extends Error {
	constructor(public event: E, public originalEvent: DecodedEvent<R>) {
		super();
		this.message = 'The provided event had no original event inside. The library inject a attribute with a symbol in orer to keep track of the original event data. If the event is rebuild by the user, the library won\'t be able to getthe required original data for operation like ack & nack. Please, make sure that the original event is the one you are providing to the library and not a copy done by a library or the user.';
	}
}

export class ErrorOnEventReconstruction<E> extends Error{

	constructor(public originalEvent: E, public error: any) {
		super();
		this.message = 'There was an error when calling the user factoy for an event. You can find the event in the attribute "originalEvent" and the error in the attribute "error"';
	}
}
