import {backoffFibonacci, BackoffExecutor} from '../corebus/backoff';
import debug from 'debug';
import * as Google from '@google-cloud/pubsub';
import {debugLogger} from '../corebus/logger';
import {GoogleFacade} from './facade';
import {SynchronousClientProcessor} from '../corebus/synchronousClientProcessor';
import {GoogleDecodedContract, SubscriptionConfig} from './interfaces';
import {ErrorLogger, BulkDispatcher, Dispatcher, ParallelScheduler, pipelineFactory} from '../index';
import {GoogleClient} from './client';
import {EventProcessor} from '../corebus/eventProcessor';
import {DecodedEvent} from '../corebus/interfaces';
import {decodeEventstoreResponse} from './utils';
import {EmptyTracker} from '../corebus/emptyTracker';
import {GoogleEventFactory, GoogleInstance} from './eventFactory';

export function create(
	filePath: string,
	projectName: string,
	subscriptions: Array<SubscriptionConfig>,
	errorLogger?: ErrorLogger,
	): GoogleFacade<GoogleInstance> {

	const logger = errorLogger || debugLogger(debug('EventStoryBus:error'));
	const tracker = new EmptyTracker();
	const backoffStrategy = createBackoff();

	const subscriber = new (Google as any).v1.SubscriberClient({keyFilename: filePath});
	const publisher = new (Google as any).v1.PublisherClient({keyFilename: filePath});

	const googleClient = new GoogleClient(projectName, filePath, subscriber, publisher);
	const dispatcher = createDispatcher<GoogleInstance>(logger);

	const googleFactory = new GoogleEventFactory();
	/* istanbul ignore next */ // And that is why you should never import classes but to use a DI :D
	const recreateEvent = (event: unknown): GoogleInstance => googleFactory.build(event as DecodedEvent<GoogleDecodedContract>);

	const eventProcessor = new EventProcessor<GoogleInstance, GoogleDecodedContract>(recreateEvent, logger, dispatcher, googleClient);
	/* istanbul ignore next */ // And that is why you should never import classes but to use a DI :D
	const onEvent = (events: DecodedEvent<GoogleDecodedContract>[]) => eventProcessor.processEvents(events);

	const synchronousClientProcessor = new SynchronousClientProcessor<GoogleInstance, SubscriptionConfig, GoogleDecodedContract>(googleClient, onEvent, logger, backoffStrategy, decodeEventstoreResponse, subscriptions, tracker, 25000);

	return new GoogleFacade<GoogleInstance>(synchronousClientProcessor, googleClient, dispatcher);
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
