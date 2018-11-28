import {TypedEvent} from '../corebus/interfaces';

export interface EventStoreConnectionOptions {
	hostname: string;
	port: number;
	credentials: {
		username: string,
		password: string,
	};
}

export interface IEventstoreEvent{
	origin: string; // Events needs to be routed to a stream called with the name
}

export const originalEventSymbol: unique symbol = Symbol('originalEvent');

export type OriginalType = IEventstoreEvent & TypedEvent & {
	ack: string;
	nack: string;
	data: any;
	metadata: any | void;
	eventId: string;
};

export type DecodedSerializedEventstoreEvent = IEventstoreEvent & OriginalType;

export interface IEventstoreEventReceived extends IEventstoreEvent {
	[originalEventSymbol]: OriginalType;
}

export interface IFactory<T = {}> {
	build(serializedEvent: {}): T;
}

export interface IEventFactory<T = {}> extends IFactory {
	build(serializedEvent: DecodedSerializedEventstoreEvent): T;
}

export type EventstoreFeedbackHTTP = (url: string) => Promise<void>;
