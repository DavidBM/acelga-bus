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
	eventType: string; // Every event has a type in Eventstore
}

export interface IFactory<T = {}> {
	build(serializedEvent: {}): T;
}

export interface IEventFactory<T = {}> extends IFactory {
	build(serializedEvent: IDecodedSerializedEventstoreEvent): T;
}

export type ErrorLogger = (...args: unknown[]) => void;
