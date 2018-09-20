import {EventStoreBus, EventAlreadySubscribed} from '@src/eventstore/eventstoreBus';
import {createSpiedMockedEventstoreClient} from './mocks'
import {EventstoreClient} from '@src/eventstore/eventstoreClient';
import {ErrorLogger} from '../../';
import {BackoffExecutor} from '@src/eventstore/backoff';
import {EventFactoryRespository} from '@src/eventstore/factoryRepository';
import BulkDispatcher from '@src/corebus/dispatchers/bulk';
import {Dispatcher} from '@src/corebus/dispatchers/single';
import Scheduler from '@src/corebus/schedulers/parallel';
import {IScheduler} from '@src/corebus/interfaces';
import {IEventstoreEvent} from '@src/eventstore/interfaces';
import {pipelineFactory} from '@src/corebus/pipeline/factory';
import {HTTPClient} from 'geteventstore-promise';

class EventA implements IEventstoreEvent {
	aggregate = 'aggregateA';
	hola(): number {
		return 2;
	}
};
class EventB implements IEventstoreEvent {
	aggregate = 'aggregateB';
};

function createBus (){
	const {
		client: client,
		backoffSummary: backoffSummary,
		errorLogger: errorLogger,
		evClient: esClient,
		backoff: backoff,
	} = createSpiedMockedEventstoreClient(1);

	let dispatcher = new Dispatcher<IEventstoreEvent>();
	let scheduler = new Scheduler<IEventstoreEvent>();

	let bulkDispatcher = new BulkDispatcher<IEventstoreEvent>(dispatcher, scheduler, pipelineFactory, errorLogger);
	jest.spyOn(bulkDispatcher, 'on');
	let eventFactoryRepository = new EventFactoryRespository();
	let bus = new EventStoreBus(client, errorLogger, eventFactoryRepository, bulkDispatcher);

	return {
		client,
		backoffSummary,
		errorLogger,
		esClient,
		backoff,
		dispatcher,
		scheduler,
		bulkDispatcher,
		eventFactoryRepository,
		bus,
	}
}

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
		let {
			client: _client,
			backoffSummary: _backoffSummary,
			errorLogger: _errorLogger,
			esClient: _esClient,
			backoff: _backoff,
			dispatcher: _dispatcher,
			scheduler: _scheduler,
			bulkDispatcher: _bulkDispatcher,
			eventFactoryRepository: _eventFactoryRepository,
			bus: _bus,
		} = createBus();

		client = _client;
		backoffSummary = _backoffSummary;
		errorLogger = _errorLogger;
		esClient = _esClient;
		backoff = _backoff;
		dispatcher = _dispatcher;
		scheduler = _scheduler;
		bulkDispatcher = _bulkDispatcher;
		eventFactoryRepository = _eventFactoryRepository;
		bus = _bus;
	});

	it('should add the correct subscription', () => {
		bus.on(EventA, (event) =>  {
			return Promise.resolve();
		});

		expect(bulkDispatcher.on).toHaveBeenCalled()
	});

	it('should not allow more than one listeners by event', () => {
		bus.on(EventA, (event) =>  {
			return Promise.resolve();
		});

		expect(() => bus.on(EventA, () => {})).toThrow(EventAlreadySubscribed)
	});

	it('should receive all events in the case of onAny', (done) => {
		const {bus} = createBus();

		const handler = jest.fn().mockImplementation(() => Promise.resolve());
		const factory = jest.fn().mockImplementation(() => {return {aggregate: ''}});

		bus.addEventType(EventA, {build: factory});

		bus.onAny(handler);

		setTimeout(() => {
			expect(factory).toHaveBeenCalled();
			done()
		}, 500);
	});
});