import {HTTPClient} from 'geteventstore-promise';
import {backoffFibonacci, BackoffExecutor} from '../corebus/backoff';
import debug from 'debug';

import {debugLogger} from '../corebus/logger';
import {EventstoreFacade} from './facade';
import {EventFactoryRespository} from '../corebus/eventFactoryRepository';
import {EventStoreConnectionOptions, IEventstoreEvent, DecodedSerializedEventstoreEvent} from './interfaces';
import {ErrorLogger, BulkDispatcher, Dispatcher, ParallelScheduler, pipelineFactory} from '../index';
import {EventstoreClient, SubscriptionDefinition} from './client';
import {EventProcessor} from '../corebus/eventProcessor';
import {eventstoreFeedbackHTTP, isValidDecodedEventStore, decodeEventstoreResponse} from './utils';
import {EmptyTracker} from '../corebus/emptyTracker';

export function create< T extends IEventstoreEvent = IEventstoreEvent>(
	connectionOptions: EventStoreConnectionOptions,
	subscriptions: Array<SubscriptionDefinition>,
	errorLogger?: ErrorLogger,
	): EventstoreFacade<T> {

	const logger = errorLogger || debugLogger(debug('EventStoryBus:error'));
	const tracker = new EmptyTracker();
	const client = new HTTPClient(connectionOptions);
	const backoffStrategy = createBackoff();
	const eventFactory = new EventFactoryRespository<T, DecodedSerializedEventstoreEvent>(isValidDecodedEventStore);
	const eventstoreClient = new EventstoreClient(client, eventstoreFeedbackHTTP, logger, backoffStrategy, decodeEventstoreResponse, subscriptions, tracker, 25000);
	const dispatcher = createDispatcher<T>(logger);
	const eventProcessor = new EventProcessor<T, DecodedSerializedEventstoreEvent>(eventFactory, logger, dispatcher, eventstoreClient);

	/* istanbul ignore next */ // We ignore this line because for testing this callback we would need a DI (or to give factories for each instance) and there is no reason for only one line that cannot be tested when we already have the types.
	eventstoreClient.setHandler(events => eventProcessor.processEvents(events));

	return new EventstoreFacade<T>(eventstoreClient, eventProcessor, dispatcher);
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
