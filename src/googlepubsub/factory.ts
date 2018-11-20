import {HTTPClient} from 'geteventstore-promise';
import {backoffFibonacci, BackoffExecutor} from '../corebus/backoff';
import debug from 'debug';

import {debugLogger} from '../corebus/logger';
import {GooglePubSub} from './bus';
import {EventFactoryRespository} from './factoryRepository';
import {EventStoreConnectionOptions, IEventstoreEvent, EventstoreFeedbackHTTP} from './interfaces';
import {ErrorLogger, BulkDispatcher, Dispatcher, ParallelScheduler, pipelineFactory} from '../index';
import {GoogleClient, SubscriptionDefinition} from './client';
import {eventstoreFeedbackHTTP, isValidDecodedEventStore, decodeEventstoreResponse} from './utils';
import {EmptyTracker} from '../corebus/emptyTracker';

export function create< T extends IEventstoreEvent = IEventstoreEvent>(
	connectionOptions: EventStoreConnectionOptions,
	subscriptions: Array<SubscriptionDefinition>,
	errorLogger?: ErrorLogger,
	): GooglePubSub<T> {

	const logger = errorLogger || debugLogger(debug('EventStoryBus:error'));
	const tracker = new EmptyTracker();
	const client = new HTTPClient(connectionOptions);
	const backoffStrategy = createBackoff();
	const eventFactory = new EventFactoryRespository<T>(isValidDecodedEventStore);
	const googleClient = new GoogleClient(client, eventstoreFeedbackHTTP, logger, backoffStrategy, decodeEventstoreResponse, subscriptions, tracker, 25000);
	const dispatcher = createDispatcher<T>(logger);

	return new GooglePubSub<T>(googleClient, logger, eventFactory, dispatcher);
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
