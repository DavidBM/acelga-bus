import {IFactory, IDecodedSerializedEventstoreEvent} from './interfaces';

export class EventFactoryRespository<T> {
	factories: Map<string, IFactory<T>> = new Map();

	set(name: string, factory: IFactory<T>): void {
		if (this.factories.get(name)) {
			// We throw here because this function is usually called in
			// the instantiation of the application. We want to fail fast & hard
			// in order to show the error to the developer.
			throw new EventNameCollision();
		}

		this.factories.set(name, factory);
	}

	get(name: string) {
		this.factories.get(name);
	}

	execute(event: unknown) {

		if (!this.isIDecodedSerializedEventstoreEvent(event)){
			throw new NotADecodedSerializedEventstoreEvent(event);
		}

		const eventFactory = this.factories.get(event.eventType); // Is this correct?

		if (!eventFactory) {
			throw new FactoryNotFoundError();
		}

		return eventFactory.build(event);
	}

	isIDecodedSerializedEventstoreEvent(item: any): item is IDecodedSerializedEventstoreEvent {
		if (!!item && typeof item === 'object' && 'eventType' in item){
			true;
		}

		return false;
	}
}

export class FactoryNotFoundError extends Error {
	constructor() {
		super();
		this.message = 'Event Factory not found';
	}
}

export class NotADecodedSerializedEventstoreEvent extends Error {
	givenEvent: any;

	constructor(givenEvent: any) {
		super();
		this.givenEvent = givenEvent;
		this.message = 'The middleware for passing from a raw eventstore JSON object to a Event class has found that the data given is not an event. The original data is in the attribute "givenEvent" of this Error object';
	}
}

export class EventNameCollision extends Error {
	constructor() {
		super();
		this.message = 'The event you are trying to register seem to be registered previously. Maybe you are registerint it 2 times or you have 2 classes with the same name.';
	}
}
