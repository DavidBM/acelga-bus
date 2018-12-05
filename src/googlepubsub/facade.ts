import {IEventBus, Constructable, EventSubscriptionCallback, BulkDispatcher} from '../index';
import {GoogleEvent, DecodedGoogleEvent, ReceivedGoogleEvent} from './interfaces';
import {EventFactory} from '../corebus/interfaces';
import {EventAlreadySubscribed} from '../corebus/commonErrors';
import {EventProcessor} from '../corebus/eventProcessor';
import {GoogleClient} from './client';

export class GoogleFacade<T extends GoogleEvent> implements IEventBus {

	constructor(
		private client: GoogleClient,
		private eventProcessor: EventProcessor<T, DecodedGoogleEvent>,
		private dispatcher: BulkDispatcher<T>,
	) {}

	publish(event: T): Promise<void> {
		const topic = event.origin;
		return this.client.publish(topic, event.constructor.name, event);
	}

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1 & ReceivedGoogleEvent> ): void {
		if (this.dispatcher.isListened(eventType)) {
			throw new EventAlreadySubscribed<T>(eventType);
		}
		// We are returning extra data in the events
		return this.dispatcher.on(eventType, callback as EventSubscriptionCallback<T1>);
	}

	public addEventType(event: Constructable<T>, factory: EventFactory<T, DecodedGoogleEvent>): void {
		this.eventProcessor.addEventType(event, factory);
	}
}
