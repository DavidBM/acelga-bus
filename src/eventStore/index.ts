import * as eventstore from 'geteventstore-promise';
import * as backoff from 'backoff';
import * as debug from 'debug';

import {EventStoreBus} from './eventstoreBus';
import {EventFactoryRespository} from './factoryRepository';
import {EventStoreConnectionOptions, IEventstoreEvent, ErrorLogger} from './interfaces';

export function create< T extends IEventstoreEvent = IEventstoreEvent>(
	connectionOptions: EventStoreConnectionOptions, 
	streamName: string, 
	startPosition: number = 0,
	errorLogger?: ErrorLogger,
	): EventStoreBus<T> {

	const logger = errorLogger || debug('EventStoryBuss:error');
	const client = createEventstoreConnection(connectionOptions);
	const backoffStrategy = createBackoff();
	const eventFactory = createEventFactoryRepository<T>();

	return new EventStoreBus<T>(client, backoffStrategy, logger, eventFactory, streamName, startPosition);
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