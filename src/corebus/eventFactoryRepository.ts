import {EventFactory, DecodedEvent} from './interfaces';

type Validator<E> = (event: any) => event is DecodedEvent<E>;

export class EventFactoryRespository<T, D> {
	factories: Map<string, EventFactory<T, D>> = new Map();

	constructor(private validator: Validator<D>) {}

	set(name: string, factory: EventFactory<T, D>): void {
		if (this.factories.get(name)) {
			// We throw here because this function is usually called in
			// the instantiation of the application. We want to fail fast & hard
			// in order to show the error to the developer.
			throw new EventNameCollision(name, factory);
		}

		this.factories.set(name, factory);
	}

	get(name: string) {
		return this.factories.get(name);
	}

	execute(event: unknown) {
		if (!this.validator(event)){
			throw new NotADecodedSerializedEventstoreEvent(event);
		}

		const eventFactory = this.factories.get(event.eventType);

		if (!eventFactory) {
			throw new FactoryNotFoundError();
		}

		return eventFactory.build(event);
	}
}

export class FactoryNotFoundError extends Error {
	constructor() {
		super();
		this.message = 'Event Factory not found';
	}
}

export class NotADecodedSerializedEventstoreEvent extends Error {
	constructor(public givenEvent: any) {
		super();
		this.message = 'The middleware for passing from a raw eventstore JSON object to a Event class has found that the data given is not an event. The original data is in the attribute "givenEvent" of this Error object';
	}
}

export class EventNameCollision<E, R> extends Error {
	constructor(public name: string, public factory: EventFactory<E, R>) {
		super();
		this.message = 'The event you are trying to register seem to be registered previously. Maybe you are registerint it 2 times or you have 2 classes with the same name. You can find the eventName and the factory in the "event" and "factory" attributes int his error';
	}
}
