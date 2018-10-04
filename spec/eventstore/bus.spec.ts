import {EventStoreBus, EventAlreadySubscribed} from '@src/eventstore/bus';
import {createSpiedMockedEventstoreClient, createBrokenPipelineFactory} from './mocks';
import {EventstoreClient} from '@src/eventstore/client';
import {ErrorLogger} from '../../';
import {BackoffExecutor} from '@src/eventstore/backoff';
import {EventFactoryRespository, FactoryNotFoundError} from '@src/eventstore/factoryRepository';
import BulkDispatcher from '@src/corebus/dispatchers/bulk';
import {Dispatcher} from '@src/corebus/dispatchers/single';
import Scheduler from '@src/corebus/schedulers/parallel';
import {IScheduler} from '@src/corebus/interfaces';
import {IEventstoreEvent} from '@src/eventstore/interfaces';
import {pipelineFactory} from '@src/corebus/pipeline/factory';
import {HTTPClient} from 'geteventstore-promise';

class EventA implements IEventstoreEvent {
	aggregate = 'aggregateA';
	Hola = 'data';
	hola(): number {
		return 2;
	}
}

class EventB implements IEventstoreEvent {
	aggregate = 'aggregateB';
}

function createBus(pipelineFactoryToInject: any = pipelineFactory){
	const {
		client: client,
		backoffSummary: backoffSummary,
		errorLogger: errorLogger,
		evClient: evClient,
		backoff: backoff,
	} = createSpiedMockedEventstoreClient(1, [{stream: 'a', subscription: 'a'}]);

	const dispatcher = new Dispatcher<IEventstoreEvent>();
	const scheduler = new Scheduler<IEventstoreEvent>();
	const bulkDispatcher = new BulkDispatcher<IEventstoreEvent>(dispatcher, scheduler, pipelineFactoryToInject, errorLogger);
	jest.spyOn(bulkDispatcher, 'on');
	const eventFactoryRepository = new EventFactoryRespository();
	const bus = new EventStoreBus(client, errorLogger, eventFactoryRepository, bulkDispatcher);

	return {
		client,
		backoffSummary,
		errorLogger,
		evClient,
		backoff,
		dispatcher,
		scheduler,
		bulkDispatcher,
		eventFactoryRepository,
		bus,
	};
}

describe('EventstoreBus', () => {
	let evClient: HTTPClient;
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
			client: _client,
			backoffSummary: _backoffSummary,
			errorLogger: _errorLogger,
			evClient: _evClient,
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
		evClient = _evClient;
		backoff = _backoff;
		dispatcher = _dispatcher;
		scheduler = _scheduler;
		bulkDispatcher = _bulkDispatcher;
		eventFactoryRepository = _eventFactoryRepository;
		bus = _bus;
	});

	it('should add the correct subscription', async () => {
		await bus.startConsumption();
		bus.on(EventA, (event) =>  {
			return Promise.resolve();
		});

		expect(bulkDispatcher.on).toHaveBeenCalled();
	});

	it('should not allow more than one listeners by event', () => {
		bus.on(EventA, (event) =>  {
			return Promise.resolve();
		});

		expect(() => bus.on(EventA, () => {})).toThrow(EventAlreadySubscribed);
	});

	it('should not call the handler in the case of a event already subscribed', (done) => {
		bus.startConsumption();
		const handlerA = jest.fn().mockImplementation(() => Promise.resolve());
		const handlerB = jest.fn().mockImplementation(() => Promise.resolve());
		const factoryA = jest.fn().mockImplementation(() => new EventA());
		const factoryB = jest.fn().mockImplementation(() => new EventB());

		bus.addEventType(EventA, {build: factoryA});
		bus.addEventType(EventB, {build: factoryB});

		bus.on(EventA, handlerA);
		expect(() => bus.on(EventA, handlerB)).toThrow(EventAlreadySubscribed);

		setTimeout(() => {
			expect(handlerA).toHaveBeenCalledTimes(1);
			expect(handlerB).toHaveBeenCalledTimes(0);
			expect(factoryA).toHaveBeenCalledTimes(1);
			expect(factoryB).toHaveBeenCalledTimes(1);
			done();
		}, 5);
	});

	it('should receive all events in the case of a correct subscription', (done) => {
		bus.startConsumption();
		const handlerA = jest.fn().mockImplementation(() => Promise.resolve());
		const handlerB = jest.fn().mockImplementation(() => Promise.resolve());
		const factoryA = jest.fn().mockImplementation(() => new EventA());
		const factoryB = jest.fn().mockImplementation(() => new EventB());

		bus.addEventType(EventA, {build: factoryA});
		bus.addEventType(EventB, {build: factoryB});

		bus.on(EventA, handlerA);
		bus.on(EventB, handlerB);

		setTimeout(() => {
			expect(handlerA).toHaveBeenCalledTimes(1);
			expect(handlerB).toHaveBeenCalledTimes(1);
			expect(factoryA).toHaveBeenCalledTimes(1);
			expect(factoryB).toHaveBeenCalledTimes(1);
			done();
		}, 5);
	});

	it('should receive all events in the case of onAny', (done) => {
		bus.startConsumption();

		const factoryResult = {aggregate: Math.random() + ''};

		const handler = jest.fn().mockImplementation(() => Promise.resolve());
		const factory = jest.fn().mockImplementation(() => factoryResult);

		bus.addEventType(EventA, {build: factory});

		bus.onAny(handler);

		setTimeout(() => {
			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith(factoryResult);
			expect(factory).toHaveBeenCalledTimes(1);
			done();
		}, 5);
	});

	it('should log an error if an event without factory is received', (done) => {
		bus.startConsumption();

		const handler = jest.fn().mockImplementation(() => Promise.resolve());
		const factory = jest.fn().mockImplementation(() => ({aggregate: ''}));

		bus.addEventType(EventA, {build: factory});

		setTimeout(() => {
			expect(errorLogger).toHaveBeenCalledTimes(1);
			expect(errorLogger).toHaveBeenCalledWith(new FactoryNotFoundError());
			done();
		}, 5);
	});

	it('should nack all messages when there is an internal error', async (done) => {
		const {bus: _bus, client: _client} = createBus(createBrokenPipelineFactory());

		const factoryA = jest.fn().mockImplementation(() => new EventA());
		const factoryB = jest.fn().mockImplementation(() => new EventB());

		_bus.addEventType(EventA, {build: factoryA});
		_bus.addEventType(EventB, {build: factoryB});

		await _bus.startConsumption();
		await _bus.stop();

		expect(_client.nack).toHaveBeenCalledTimes(2);
		done();
	});
});
