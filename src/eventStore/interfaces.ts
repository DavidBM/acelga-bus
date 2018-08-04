export interface EventStoreConnectionOptions {
	hostname: string;
	port: string;
	credentials: {
		username: string,
		password: string,
	};
}
