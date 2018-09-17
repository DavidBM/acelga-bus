import {HTTPClient} from 'geteventstore-promise';
import {backoffFibonacci, BackoffExecutor} from './backoff';
import * as debug from 'debug';

import {debugLogger} from '@src/corebus/logger';
import {EventStoreBus} from './eventstoreBus';
import {EventFactoryRespository} from './factoryRepository';
import {EventStoreConnectionOptions, IEventstoreEvent} from './interfaces';
import {ErrorLogger, BulkDispatcher, Dispatcher, ParallelScheduler, pipelineFactory} from '../index';
import {EventstoreClient, SubscriptionDefinition} from './eventstoreClient';

export function create< T extends IEventstoreEvent = IEventstoreEvent>(
	connectionOptions: EventStoreConnectionOptions,
	subscriptions: Array<SubscriptionDefinition>,
	errorLogger?: ErrorLogger,
	): EventStoreBus<T> {

	const logger = errorLogger || debugLogger(debug('EventStoryBus:error'));
	const client = createEventstoreConnection(connectionOptions);
	const backoffStrategy = createBackoff();
	const eventFactory = createEventFactoryRepository<T>();
	const eventstoreClient = createEventstoreClient(client, logger, backoffStrategy, subscriptions);
	const dispatcher = createDispatcher<T>(logger);

	return new EventStoreBus<T>(eventstoreClient, logger, eventFactory, dispatcher);
}

function createBackoff(): BackoffExecutor {
	return backoffFibonacci({
		randomisationFactor: 0,
		initialDelay: 100,
		maxDelay: 7000,
	});
}

function createEventstoreConnection(options: EventStoreConnectionOptions): any {
	return new HTTPClient(options);
}

function createEventFactoryRepository<T extends IEventstoreEvent>(): EventFactoryRespository<T> {
	return new EventFactoryRespository<T>();
}

function createEventstoreClient(client: any, errorLogger: ErrorLogger, backoffStrategy: BackoffExecutor, subscriptions: Array<SubscriptionDefinition>) {
	return new EventstoreClient(client, errorLogger, backoffStrategy, subscriptions);
}

function createDispatcher<T>(errorLogger: ErrorLogger) {
	const dispatcher = new Dispatcher<T>();
	const scheduler = new ParallelScheduler<T>();
	return new BulkDispatcher<T>(dispatcher, scheduler, pipelineFactory, errorLogger);
}
