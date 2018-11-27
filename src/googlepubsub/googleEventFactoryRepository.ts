import {IFactory, IDecodedSerializedEventstoreEvent, IEventstoreEvent, originalEventSymbol} from './interfaces';
import {isValidDecodedEventStore} from './utils';

export class GoogleEventFactoryRespository<T extends IEventstoreEvent> {
	factories: Map<string, IFactory<T>> = new Map();
	validator: (event: any) => event is IDecodedSerializedEventstoreEvent;

	constructor(validator: (event: any) => event is IDecodedSerializedEventstoreEvent) {
		this.validator = validator;
	}

	set(name: string, factory: IFactory<T>): void {
		if (this.factories.get(name)) {
			// We throw here because this function is usually called in
			// the instantiation of the application. We want to fail fast & hard
			// in order to show the error to the developer.
			throw new GoogleEventNameCollision(name, factory);
		}

		this.factories.set(name, factory);
	}

	get(name: string) {
		return this.factories.get(name);
	}

	execute(event: unknown) {

		if (!this.validator(event)){
			throw new NotADecodedSerializedGoogleEvent(event);
		}

		const eventFactory = this.factories.get(event.eventType);

		if (!eventFactory) {
			throw new GoogleEventFactoryNotFoundError();
		}

		return eventFactory.build(event);
	}
}

export class GoogleEventFactoryNotFoundError extends Error {
	constructor() {
		super();
		this.message = 'Event Factory not found';
	}
}

export class NotADecodedSerializedGoogleEvent extends Error {
	givenEvent: any;

	constructor(givenEvent: any) {
		super();
		this.givenEvent = givenEvent;
		this.message = 'The middleware for passing from a raw eventstore JSON object to a Event class has found that the data given is not an event. The original data is in the attribute "givenEvent" of this Error object';
	}
}

export class GoogleEventNameCollision extends Error {
	name: string;
	factory: IFactory;

	constructor(name: string, factory: IFactory) {
		super();
		this.name = name;
		this.factory = factory;
		this.message = 'The event you are trying to register seem to be registered previously. Maybe you are registerint it 2 times or you have 2 classes with the same name. You can find the eventName and the factory in the "event" and "factory" attributes int his error';
	}
}
