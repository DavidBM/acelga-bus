export interface EventStoreConnectionOptions {
	hostname: string;
	port: string;
	credentials: {
		username: string,
		password: string,
	};
}

export interface IEventstoreEvent {}

export interface IDecodedSerializedEventstoreEvent extends IEventstoreEvent {
	__eventType: string
}

export interface IEventFactory<T = {}> {
	build(serializedEvent: IDecodedSerializedEventstoreEvent): T;
}
