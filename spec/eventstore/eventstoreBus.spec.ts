import {createSpiedMockedEventstoreClient} from './mocks'
import {EventstoreClient} from '@src/eventstore/eventstoreClient';
import {EventStoreBus} from '@src/eventstore/eventstoreBus';
import {ErrorLogger} from '../../';
import {BackoffExecutor} from '@src/eventstore/backoff';
import {EventFactoryRespository} from '@src/eventstore/factoryRepository';
import BulkDispatcher from '@src/corebus/dispatchers/bulk';
import {Dispatcher} from '@src/corebus/dispatchers/single';
import Scheduler from '@src/corebus/schedulers/parallel';
import {IScheduler} from '@src/corebus/interfaces';
import {pipelineFactory} from '@src/corebus/pipeline/factory';
import {HTTPClient} from 'geteventstore-promise';

describe('EventstoreBus', () => {
	let esClient: HTTPClient;
	let client: EventstoreClient;
	let bus: EventStoreBus;
	let errorLogger: ErrorLogger;
	let backoff: BackoffExecutor;
	let backoffSummary: {
		resetCalls: number,
		backoffCalls: number,
	};
	let eventFactoryRepository: EventFactoryRespository<any>; 
	let dispatcher: Dispatcher<any>;
	let scheduler: IScheduler<any>;
	let bulkDispatcher: BulkDispatcher<any>;

	beforeEach(() => {
		const {
			client: _evClient,
			backoffSummary: _backoffSummary,
			errorLogger: _errorLogger,
			evClient: _client,
			backoff: _backoff,
		} = createSpiedMockedEventstoreClient(1);

		esClient = _client;
		client = _evClient
		errorLogger = _errorLogger;
		backoff = _backoff;
		backoffSummary = _backoffSummary;

		dispatcher = new Dispatcher();
		scheduler = new Scheduler();

		bulkDispatcher = new BulkDispatcher(dispatcher, scheduler, pipelineFactory, errorLogger);

		bus = new EventStoreBus(client, errorLogger, eventFactoryRepository, bulkDispatcher);
	});
});