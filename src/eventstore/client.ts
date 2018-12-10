import {HTTPClient} from 'geteventstore-promise';
import {DecodedSerializedEventstoreEvent, EventstoreDecodedContract, EventstoreFeedbackHTTP, EventInstanceContract, SubscriptionDefinition} from './interfaces';
import {FullSyncronousClient, Event} from '../corebus/interfaces';

export class EventstoreClient<T extends EventInstanceContract> implements FullSyncronousClient<T, EventstoreDecodedContract, SubscriptionDefinition>{

	protected messagesToGet = 100;

	constructor(
		protected client: HTTPClient,
		protected signal: EventstoreFeedbackHTTP,
	) {	}

	public publish(event: Event<T>): Promise<void> {
		return this.client.writeEvent(event.origin, event.constructor.name, event); // Asuming good serialization
	}

	public async getEvents(config: SubscriptionDefinition) {
		return this.client.persistentSubscriptions.getEvents(config.subscription, config.stream, this.messagesToGet, 'body');
	}

	async ack(event: DecodedSerializedEventstoreEvent): Promise<void> {
		await this.signal(event.ack);
	}

	async nack(event: DecodedSerializedEventstoreEvent): Promise<void> {
		await this.signal(event.nack);
	}
}
