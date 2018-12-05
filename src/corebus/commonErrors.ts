import {Constructable} from './interfaces';

export class EventAlreadySubscribed<T> extends Error {
	eventType: Constructable<T>;

	constructor(eventType: Constructable<T>) {
		super();
		this.eventType = eventType;
		this.message = 'The Event you want to subscribe already has one subscription. Only one subscription is allowed in order to keep processing simple to reason about. If you want to do that for sure, please, create a new Bus instance.';
	}
}
