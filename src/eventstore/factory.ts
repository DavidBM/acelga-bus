import {HTTPClient} from 'geteventstore-promise';
import {backoffFibonacci, BackoffExecutor} from './backoff';
import debug from 'debug';

import {debugLogger} from '@src/corebus/logger';
import {EventStoreBus} from './bus';
import {EventFactoryRespository} from './factoryRepository';
import {EventStoreConnectionOptions, IEventstoreEvent, EventstoreFeedbackHTTP} from './interfaces';
import {ErrorLogger, BulkDispatcher, Dispatcher, ParallelScheduler, pipelineFactory} from '../index';
import {EventstoreClient, SubscriptionDefinition} from './client';
import {eventstoreFeedbackHTTP, isValidDecodedEventStore, decodeEventstoreResponse} from '@src/eventstore/utils';
import {EmptyTracker} from '@src/eventstore/emptyTracker';

export function create< T extends IEventstoreEvent = IEventstoreEvent>(
	connectionOptions: EventStoreConnectionOptions,
	subscriptions: Array<SubscriptionDefinition>,
	errorLogger?: ErrorLogger,
	): EventStoreBus<T> {

	const logger = errorLogger || debugLogger(debug('EventStoryBus:error'));
	const tracker = new EmptyTracker();
	const client = new HTTPClient(connectionOptions);
	const backoffStrategy = createBackoff();
	const eventFactory = new EventFactoryRespository<T>(isValidDecodedEventStore);
	const eventstoreClient = new EventstoreClient(client, eventstoreFeedbackHTTP, logger, backoffStrategy, decodeEventstoreResponse, subscriptions, tracker, 25000);
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

function createDispatcher<T>(errorLogger: ErrorLogger) {
	const dispatcher = new Dispatcher<T>();
	const scheduler = new ParallelScheduler<T>();
	return new BulkDispatcher<T>(dispatcher, scheduler, pipelineFactory, errorLogger);
}
