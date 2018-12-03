import {IEventBus, Constructable, EventSubscriptionCallback, ErrorLogger, BulkDispatcher, EventFactoryRespository} from '../index';
import {IGoogleEvent, DecodedSerializedGoogleEvent} from './interfaces';
import {GoogleClient} from './client';

type EventRepository<T extends IGoogleEvent = IGoogleEvent> = EventFactoryRespository<T, DecodedSerializedGoogleEvent>;

export class GooglePubSubBus<T extends IGoogleEvent> implements IEventBus {

	constructor(
		protected dispatcher: BulkDispatcher<T>,
		protected logError: ErrorLogger,
		protected eventRepository: EventRepository<T>,
		protected client: GoogleClient,
	) {}

	publish(event: T): Promise<void> {
		const topic = event.origin;
		return this.client.publish(topic, event.constructor.name, event);
	}

	on(event: Constructable<T>, callback: EventSubscriptionCallback<T>): void {

	}
}
