export interface EventStoreConnectionOptions {
	hostname: string;
	port: string;
	credentials: {
		username: string,
		password: string,
	};
}

export interface IEventstoreEvent {
	eventType: string;
}

export interface IDecodedSerializedEventstoreEvent extends IEventstoreEvent {}

export interface IEventFactory<T = {}> {
	build(serializedEvent: IDecodedSerializedEventstoreEvent): T;
	getEventType: () => string;
}
