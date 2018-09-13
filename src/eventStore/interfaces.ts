export interface EventStoreConnectionOptions {
	hostname: string;
	port: string;
	credentials: {
		username: string,
		password: string,
	};
}

export interface IEventstoreEvent {
	aggregate: string; // Events needs to be routed to a stream called with the name
}

export interface IDecodedSerializedEventstoreEvent extends IEventstoreEvent {
	eventType: string; // Every event has a type in Eventstore,

}

export interface IFactory<T = {}> {
	build(serializedEvent: {}): T;
}

export interface IEventFactory<T = {}> extends IFactory {
	build(serializedEvent: IDecodedSerializedEventstoreEvent): T;
}
