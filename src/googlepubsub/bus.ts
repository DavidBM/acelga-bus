import {IEventBus, Constructable, EventSubscriptionCallback} from '../corebus/interfaces';
import {IGoogleEvent} from './interfaces';

export class GooglePubSubBus<T extends IGoogleEvent> implements IEventBus {

	publish(): Promise<void> {
		return Promise.resolve();
	}

	on(event: Constructable<T>, callback: EventSubscriptionCallback<T>): void {

	}
}
