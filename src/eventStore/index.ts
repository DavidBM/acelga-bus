import * as eventstore from 'geteventstore-promise';
import * as backoff from 'backoff';
import * as debug from 'debug';

import {EventStoreBus} from './eventstoreBus';
import {EventFactoryRespository} from './factoryRepository';
import {EventStoreConnectionOptions, IEventstoreEvent, ErrorLogger} from './interfaces';
import {EventstoreClient} from './eventstoreConsumer';

export function create< T extends IEventstoreEvent = IEventstoreEvent>(
	connectionOptions: EventStoreConnectionOptions,
	streamName: string,
	startPosition: number = 0,
	errorLogger?: ErrorLogger,
	): EventStoreBus<T> {

	const logger = errorLogger || debug('EventStoryBus:error');
	const client = createEventstoreConnection(connectionOptions);
	const backoffStrategy = createBackoff();
	const eventFactory = createEventFactoryRepository<T>();
	const eventstoreClient = createEventstoreClient(client, logger, backoffStrategy, streamName, startPosition);

	return new EventStoreBus<T>(eventstoreClient, logger, eventFactory);
}

function createBackoff(): backoff.Backoff {
	return backoff.fibonacci({
		randomisationFactor: 0,
		initialDelay: 300,
		maxDelay: 7000,
	});
}

function createEventstoreConnection(options: EventStoreConnectionOptions): any {
	return eventstore.http(options);
}

function createEventFactoryRepository<T>(): EventFactoryRespository<T> {
	return new EventFactoryRespository();
}


function createEventstoreClient(client: any, errorLogger: ErrorLogger, backoffStrategy: backoff.Backoff, streamName: string, startPosition: number = 0) {
	return new EventstoreClient(client, errorLogger, backoffStrategy, streamName, startPosition);
}