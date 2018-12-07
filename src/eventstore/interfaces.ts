import {Event, DecodedEvent, ReceivedEvent} from '../corebus/interfaces';

export interface EventStoreConnectionOptions {
	hostname: string;
	port: number;
	credentials: {
		username: string,
		password: string,
	};
}

export type EventstoreFeedbackHTTP = (url: string) => Promise<void>;

export type EventInstanceContract = {
	origin: string;
};

export type EventstoreDecodedContract = {
	ack: string;
	nack: string;
	data: any;
	metadata: any | void;
	eventId: string;
	origin: string;
};

export type IEventstoreEvent<T extends EventInstanceContract = EventInstanceContract> = Event<T>;

export type DecodedSerializedEventstoreEvent = DecodedEvent<EventstoreDecodedContract>;

export type IEventstoreEventReceived<T extends EventInstanceContract = EventInstanceContract> = ReceivedEvent<T, EventstoreDecodedContract>;

export type SubscriptionDefinition = {
	stream: string;
	subscription: string;
};
