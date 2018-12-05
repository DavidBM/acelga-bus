import {IEventBus, EventSubscriptionCallback, Constructable, BulkDispatcher} from '../index';
import {IEventFactory, IEventstoreEvent, IEventstoreEventReceived} from './interfaces';
import {EventProcessor} from './eventProcessor';
import {EventstoreClient} from './client';

/*
 - Reorganize the interfaces to be in the correct files. Parent files must reexport interfaces if required.
   Create a d.ts for files in order to have them in different files without importer the concrete implementation
 - Research about how to know if a msessage was no ack before
*/
export class Facade<T extends IEventstoreEvent = IEventstoreEvent> implements IEventBus<T> {

	constructor(
		private client: EventstoreClient,
		private eventProcessor: EventProcessor<T>,
		private dispatcher: BulkDispatcher<T>,
	) {	}

	public startConsumption() {
		return this.client.ping()
		.then(() => this.client.startConsumption());
	}

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1 & IEventstoreEventReceived> ): void {
		if (this.dispatcher.isListened(eventType)) {
			throw new EventAlreadySubscribed<T>(eventType);
		}
		// We are returning extra data in the events
		return this.dispatcher.on(eventType, callback as EventSubscriptionCallback<T1>);
	}

	public async stop(): Promise<void> {
		return this.client.stop();
	}

	public onAny(callback: EventSubscriptionCallback<T>): void {
		this.dispatcher.onAny(callback);
	}

	public async publish(event: T): Promise<void> {
		const eventType = event.constructor.name;
		return this.client.publish(event.origin, eventType, event);
	}

	public addEventType(event: Constructable<T>, factory: IEventFactory<T>): void {
		this.eventProcessor.addEventType(event, factory);
	}
}

export class EventAlreadySubscribed<T> extends Error {
	eventType: Constructable<T>;

	constructor(eventType: Constructable<T>) {
		super();
		this.eventType = eventType;
		this.message = 'The Event you want to subscribe already has one subscription. Only one subscription is allowed in order to keep processing simple to reason about. If you want to do that for sure, please, create a new Bus instance.';
	}
}