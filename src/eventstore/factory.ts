import {HTTPClient} from 'geteventstore-promise';
import {backoffFibonacci, BackoffExecutor} from '../corebus/backoff';
import debug from 'debug';

import {debugLogger} from '../corebus/logger';
import {EventstoreFacade} from './facade';
import {EventFactoryRespository} from '../corebus/eventFactoryRepository';
import {SynchronousClientProcessor} from '../corebus/synchronousClientProcessor';
import {EventStoreConnectionOptions, SubscriptionDefinition, EventInstanceContract, EventstoreDecodedContract} from './interfaces';
import {ErrorLogger, BulkDispatcher, Dispatcher, ParallelScheduler, pipelineFactory} from '../index';
import {EventstoreClient} from './client';
import {EventProcessor} from '../corebus/eventProcessor';
import {DecodedEvent} from '../corebus/interfaces';
import {eventstoreFeedbackHTTP, isValidDecodedEventStore, decodeEventstoreResponse} from './utils';
import {EmptyTracker} from '../corebus/emptyTracker';

export function create< T extends EventInstanceContract = EventInstanceContract>(
	connectionOptions: EventStoreConnectionOptions,
	subscriptions: Array<SubscriptionDefinition>,
	errorLogger?: ErrorLogger,
	): EventstoreFacade<T> {

	const logger = errorLogger || debugLogger(debug('EventStoryBus:error'));
	const tracker = new EmptyTracker();
	const client = new HTTPClient(connectionOptions);
	const backoffStrategy = createBackoff();
	const eventFactory = new EventFactoryRespository<T, EventstoreDecodedContract>(isValidDecodedEventStore);

	const eventstoreClient = new EventstoreClient(client, eventstoreFeedbackHTTP);
	const dispatcher = createDispatcher<T>(logger);
	/* istanbul ignore next */ // Added because we have our own factories in the tests and these are the connectors. Maybe... should they go in the facade?
	const recreateEvent = (event: unknown): T => eventFactory.execute(event);

	const eventProcessor = new EventProcessor<T, EventstoreDecodedContract>(recreateEvent, logger, dispatcher, eventstoreClient);
	/* istanbul ignore next */ // Added because we have our own factories in the tests and these are the connectors. Maybe... should they go in the facade?
	const onEvent = (events: DecodedEvent<EventstoreDecodedContract>[]) => eventProcessor.processEvents(events);

	const synchronousClientProcessor = new SynchronousClientProcessor<T, SubscriptionDefinition, EventstoreDecodedContract>(eventstoreClient, onEvent, logger, backoffStrategy, decodeEventstoreResponse, subscriptions, tracker, 25000);

	return new EventstoreFacade<T>(synchronousClientProcessor, eventstoreClient, eventFactory, dispatcher);
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
