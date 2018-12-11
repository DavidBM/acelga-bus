import {backoffFibonacci, BackoffExecutor} from '../corebus/backoff';
import debug from 'debug';

import {debugLogger} from '../corebus/logger';
import {GoogleFacade, Google} from './facade';
import {EventFactoryRespository} from '../corebus/eventFactoryRepository';
import {SynchronousClientProcessor} from '../corebus/synchronousClientProcessor';
import {GoogleDecodedContract, SubscriptionConfig} from './interfaces';
import {ErrorLogger, BulkDispatcher, Dispatcher, ParallelScheduler, pipelineFactory} from '../index';
import {GoogleClient} from './client';
import {EventProcessor} from '../corebus/eventProcessor';
import {isValidDecodedEventStore, decodeEventstoreResponse} from './utils';
import {EmptyTracker} from '../corebus/emptyTracker';

export function create(
	filePath: string,
	projectName: string,
	subscriptions: Array<SubscriptionConfig>,
	errorLogger?: ErrorLogger,
	): GoogleFacade {

	const logger = errorLogger || debugLogger(debug('EventStoryBus:error'));
	const tracker = new EmptyTracker();
	const backoffStrategy = createBackoff();
	const eventFactory = new EventFactoryRespository<Google, GoogleDecodedContract>(isValidDecodedEventStore);

	const googleClient = new GoogleClient(projectName, filePath);
	const dispatcher = createDispatcher<Google>(logger);
	const eventProcessor = new EventProcessor<Google, GoogleDecodedContract>(eventFactory, logger, dispatcher, googleClient);

	const synchronousClientProcessor = new SynchronousClientProcessor<Google, SubscriptionConfig, GoogleDecodedContract>(googleClient, eventProcessor, logger, backoffStrategy, decodeEventstoreResponse, subscriptions, tracker, 25000);

	return new GoogleFacade(synchronousClientProcessor, googleClient, eventProcessor, dispatcher);
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
