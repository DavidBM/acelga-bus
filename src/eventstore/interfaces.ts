export interface EventStoreConnectionOptions {
	hostname: string;
	port: number;
	credentials: {
		username: string,
		password: string,
	};
}

export interface IEventstoreEvent {
	aggregate: string; // Events needs to be routed to a stream called with the name
}

export const originalEventSymbol: unique symbol = Symbol('originalEvent');

export type OriginalType = IEventstoreEvent & {
	ack: string;
	nack: string;
	eventType: string; // Every event has a type in Eventstore,
	data: any;
	metadata: any | void;
	eventId: string;
}

export interface IDecodedSerializedEventstoreEvent extends IEventstoreEvent, OriginalType {}

export interface IEventstoreEventReceived extends IEventstoreEvent {
	[originalEventSymbol]: OriginalType
}

export interface IFactory<T = {}> {
	build(serializedEvent: {}): T;
}

export interface IEventFactory<T = {}> extends IFactory {
	build(serializedEvent: IDecodedSerializedEventstoreEvent): T;
}

export type EventstoreFeedbackHTTP = (url: string) => Promise<void>;
