import {EventSubscriptionCallback, Constructable, BulkDispatcher} from '../index';
import {EventInstanceContract, IEventstoreEventReceived, EventstoreDecodedContract, SubscriptionDefinition} from './interfaces';
import {EventFactory, FullSyncronousClient, ReceivedEvent} from '../corebus/interfaces';
import {EventProcessor} from '../corebus/eventProcessor';
import {EventAlreadySubscribed} from '../corebus/commonErrors';
import {SynchronousClientProcessor} from '../corebus/synchronousClientProcessor';

/*
 - Reorganize the interfaces to be in the correct files. Parent files must reexport interfaces if required.
   Create a d.ts for files in order to have them in different files without importer the concrete implementation
 - Research about how to know if a msessage was no ack before
*/
export class EventstoreFacade<T extends EventInstanceContract> {

	constructor(
		private client: SynchronousClientProcessor<T, SubscriptionDefinition, EventstoreDecodedContract>,
		private publisher: FullSyncronousClient<T, EventstoreDecodedContract, SubscriptionDefinition>,
		private eventProcessor: EventProcessor<T, EventstoreDecodedContract>,
		private dispatcher: BulkDispatcher<T>,
	) {	}

	public startConsumption() {
		return this.client.startConsumption();
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

	public publish(event: ReceivedEvent<T, EventstoreDecodedContract>): Promise<void> {
		return this.publisher.publish(event);
	}

	public addEventType<T1 extends T>(event: Constructable<T1>, factory: EventFactory<T1, EventstoreDecodedContract>): void {
		this.eventProcessor.addEventType(event, factory);
	}
}
