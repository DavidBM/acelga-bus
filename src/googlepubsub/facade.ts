import {IEventBus, Constructable, EventSubscriptionCallback, BulkDispatcher} from '../index';
import {GoogleDecodedContract, EventInstanceContract} from './interfaces';
import {EventFactory, Event, ReceivedEvent} from '../corebus/interfaces';
import {EventAlreadySubscribed} from '../corebus/commonErrors';
import {EventProcessor} from '../corebus/eventProcessor';
import {GoogleClient} from './client';

export class GoogleFacade<T extends EventInstanceContract> implements IEventBus {

	constructor(
		private client: GoogleClient<EventInstanceContract>,
		private eventProcessor: EventProcessor<T, GoogleDecodedContract>,
		private dispatcher: BulkDispatcher<T>,
	) {}

	publish(event: Event<T>): Promise<void> {
		return this.client.publish(event);
	}

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1 & ReceivedEvent<T, GoogleDecodedContract>> ): void {
		if (this.dispatcher.isListened(eventType)) {
			throw new EventAlreadySubscribed<T>(eventType);
		}
		// We are returning extra data in the events
		return this.dispatcher.on(eventType, callback as EventSubscriptionCallback<T1>);
	}

	public addEventType(event: Constructable<T>, factory: EventFactory<T, GoogleDecodedContract>): void {
		this.eventProcessor.addEventType(event, factory);
	}
}
