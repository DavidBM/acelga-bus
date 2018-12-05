/* tslint:disable:no-unused-locals */
import {EventstoreFacade} from '../../eventstore/facade';
import {EventAlreadySubscribed} from '../../corebus/commonErrors';
import {createSpiedMockedEventstoreClient, createBrokenPipelineFactory, noACKDecodedEventstoreResponse, noNACKDecodedEventstoreResponse} from './mocks';
import {ErrorLogger} from '../../';
import {EventFactoryRespository, FactoryNotFoundError} from '../../corebus/eventFactoryRepository';
import BulkDispatcher from '../../corebus/dispatchers/bulk';
import {Dispatcher} from '../../corebus/dispatchers/single';
import Scheduler from '../../corebus/schedulers/parallel';
import {IEventstoreEvent} from '../../eventstore/interfaces';
import {EventProcessor, EventWithoutOriginalEvent} from '../../corebus/eventProcessor';
import {isValidDecodedEventStore} from '../../eventstore/utils';
import {pipelineFactory} from '../../corebus/pipeline/factory';
import {originalEventSymbol} from '../../corebus/interfaces';
import {HTTPClient} from 'geteventstore-promise';

class EventA implements IEventstoreEvent {
	origin = 'aggregateA';
	Hola = 'data';
	hola(): number {
		return 2;
	}
}

class EventB implements IEventstoreEvent {
	origin = 'aggregateB';
}

function createBus(pipelineFactoryToInject: any = pipelineFactory, eventsToReturn?: any, evDecoder?: any, decodedEventValidator: any = isValidDecodedEventStore){
	const {
		client: client,
		backoffSummary: backoffSummary,
		errorLogger: errorLogger,
		evClient: evClient,
		backoff: backoff,
	} = createSpiedMockedEventstoreClient(1, [{stream: 'a', subscription: 'a'}], eventsToReturn, evDecoder);

	const dispatcher = new Dispatcher<IEventstoreEvent>();
	const scheduler = new Scheduler<IEventstoreEvent>();
	const bulkDispatcher = new BulkDispatcher<IEventstoreEvent>(dispatcher, scheduler, pipelineFactoryToInject, errorLogger);
	jest.spyOn(bulkDispatcher, 'on');
	const eventFactoryRepository = new EventFactoryRespository<any, any>(decodedEventValidator);
	const eventProcessor = new EventProcessor<any, any>(eventFactoryRepository, errorLogger, bulkDispatcher, client);
	const bus = new EventstoreFacade(client, eventProcessor, bulkDispatcher);

	client.setHandler(events => eventProcessor.processEvents(events));

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
		eventProcessor,
	};
}

describe('EventstoreFacade', () => {
	let evClient: HTTPClient;
	let bus: EventstoreFacade;
	let errorLogger: ErrorLogger;
	let bulkDispatcher: BulkDispatcher<any>;

	beforeEach(() => {
		const {
			errorLogger: _errorLogger,
			evClient: _evClient,
			bulkDispatcher: _bulkDispatcher,
			bus: _bus,
		} = createBus();

		errorLogger = _errorLogger;
		evClient = _evClient;
		bulkDispatcher = _bulkDispatcher;
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

		setTimeout(async () => {
			await bus.stop();

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

	it('should receive all events in the case of onAny', async (done) => {
		bus.startConsumption();

		const factoryResult = {origin: Math.random() + ''};

		const handler = jest.fn().mockImplementation(() => Promise.resolve());
		const factory = jest.fn().mockImplementation(() => factoryResult);

		bus.addEventType(EventA, {build: factory});

		bus.onAny(handler);

		await bus.stop();

		expect(handler).toHaveBeenCalledTimes(1);
		expect(handler).toHaveBeenCalledWith(factoryResult);
		expect(factory).toHaveBeenCalledTimes(1);
		done();
	});

	it('should wait for events to start being consumed when stop', async (done) => {

		const factoryResult = {origin: Math.random() + ''};

		const handler = jest.fn().mockImplementation(() => Promise.resolve());
		const factory = jest.fn().mockImplementation(() => factoryResult);

		bus.addEventType(EventA, {build: factory});

		bus.onAny(handler);

		bus.startConsumption();
		await bus.stop();

		expect(handler).toHaveBeenCalledTimes(1);
		expect(handler).toHaveBeenCalledWith(factoryResult);
		expect(factory).toHaveBeenCalledTimes(1);
		done();
	});

	it('should log an error if an event without factory is received', (done) => {
		bus.startConsumption();

		const factory = jest.fn().mockImplementation(() => ({origin: ''}));

		bus.addEventType(EventA, {build: factory});

		setTimeout(async () => {
			await bus.stop();

			expect(errorLogger).toHaveBeenCalledTimes(1);
			expect(errorLogger).toHaveBeenCalledWith(new FactoryNotFoundError());
			done();
		}, 0);
	});

	it('should nack all messages when there is an internal error', async (done) => {
		const {bus: _bus, client: _client} = createBus(createBrokenPipelineFactory());

		const factoryA = jest.fn().mockImplementation(() => new EventA());
		const factoryB = jest.fn().mockImplementation(() => new EventB());

		_bus.addEventType(EventA, {build: factoryA});
		_bus.addEventType(EventB, {build: factoryB});

		await _bus.startConsumption();

		setTimeout(async () => {
			await _bus.stop();

			expect(_client.nack).toHaveBeenCalledTimes(2);
			done();
		}, 0);
	});

	it('should publish the messages correctly using the client', async (done) => {
		const event = new EventA();

		bus.publish(event);

		setTimeout(async () => {
			expect(evClient.writeEvent).toHaveBeenCalledWith(event.origin, EventA.name, event);
			done();
		}, 0);
	});

	it('should nack the mesages that got an error', async (done) => {
		const {bus: _bus, client: _client} = createBus();

		const factoryA = jest.fn().mockImplementation(() => new EventA());
		const factoryB = jest.fn().mockImplementation(() => new EventB());

		_bus.addEventType(EventA, {build: factoryA});
		_bus.addEventType(EventB, {build: factoryB});

		_bus.on(EventA, (event) => Promise.resolve());
		_bus.on(EventB, (event) => Promise.reject());

		await _bus.startConsumption();

		setTimeout(async () => {
			await _bus.stop();

			expect(_client.nack).toHaveBeenCalledTimes(1);
			expect(_client.ack).toHaveBeenCalledTimes(1);
			done();
		}, 0);
	});

	it('should log an error when there is no original event', async (done) => {
		const {bus: _bus, client: _client, errorLogger: _errorLogger} = createBus(pipelineFactory, undefined, noACKDecodedEventstoreResponse, () => true);

		const factoryA = jest.fn().mockImplementation(() => new EventA());
		const factoryB = jest.fn().mockImplementation(() => new EventB());

		_bus.addEventType(EventA, {build: factoryA});
		_bus.addEventType(EventB, {build: factoryB});

		_bus.on(EventA, (event) => { delete event[originalEventSymbol]; Promise.resolve(); });
		_bus.on(EventB, (event) => { delete event[originalEventSymbol]; Promise.resolve(); });

		await _bus.startConsumption();

		setTimeout(async () => {
			await _bus.stop();

			expect(_client.ack).toHaveBeenCalledTimes(0);
			expect(_client.nack).toHaveBeenCalledTimes(0);
			expect(_errorLogger).toHaveBeenCalledTimes(2);
			expect(_errorLogger.mock.calls[0][0]).toBeInstanceOf(EventWithoutOriginalEvent);
			expect(_errorLogger.mock.calls[1][0]).toBeInstanceOf(EventWithoutOriginalEvent);

			done();
		}, 0);
	});

	it('should log an error when there is no nack link', async (done) => {
		const {bus: _bus, client: _client, errorLogger: _errorLogger} = createBus(pipelineFactory, undefined, noNACKDecodedEventstoreResponse, () => true);

		const factoryA = jest.fn().mockImplementation(() => new EventA());
		const factoryB = jest.fn().mockImplementation(() => new EventB());

		_bus.addEventType(EventA, {build: factoryA});
		_bus.addEventType(EventB, {build: factoryB});

		_bus.on(EventA, (event) => { delete event[originalEventSymbol]; return Promise.reject(); });
		_bus.on(EventB, (event) => { delete event[originalEventSymbol]; return Promise.resolve(); });

		await _bus.startConsumption();

		setTimeout(async () => {
			await _bus.stop();

			expect(_client.nack).toHaveBeenCalledTimes(0);
			expect(_client.ack).toHaveBeenCalledTimes(0);
			expect(_errorLogger).toHaveBeenCalledTimes(2);
			expect(_errorLogger.mock.calls[0][0]).toBeInstanceOf(EventWithoutOriginalEvent);
			expect(_errorLogger.mock.calls[1][0]).toBeInstanceOf(EventWithoutOriginalEvent);

			done();
		}, 0);
	});

	it('should log an error if ack call fails', async (done) => {
		const {bus: _bus, client: _client, errorLogger: _errorLogger} = createBus(pipelineFactory);
		const errorReturned = new Error('errorReturned');

		jest.spyOn(_client, 'ack').mockImplementation(() => Promise.reject(errorReturned));

		const factoryA = jest.fn().mockImplementation(() => new EventA());
		const factoryB = jest.fn().mockImplementation(() => new EventB());

		_bus.addEventType(EventA, {build: factoryA});
		_bus.addEventType(EventB, {build: factoryB});

		_bus.on(EventA, (event) => Promise.resolve());
		_bus.on(EventB, (event) => Promise.resolve());

		await _bus.startConsumption();

		setTimeout(async () => {
			await _bus.stop();

			expect(_client.ack).toHaveBeenCalledTimes(2);
			expect(_client.nack).toHaveBeenCalledTimes(0);
			expect(_errorLogger).toHaveBeenCalledTimes(2);
			expect(_errorLogger.mock.calls[0][0]).toEqual(errorReturned);

			done();
		}, 0);
	});

	it('should log an error if ack call fails', async (done) => {
		const {bus: _bus, client: _client, errorLogger: _errorLogger} = createBus(pipelineFactory);
		const errorReturned = new Error('errorReturned');

		jest.spyOn(_client, 'nack').mockImplementation(() => Promise.reject(errorReturned));

		const factoryA = jest.fn().mockImplementation(() => new EventA());
		const factoryB = jest.fn().mockImplementation(() => new EventB());

		_bus.addEventType(EventA, {build: factoryA});
		_bus.addEventType(EventB, {build: factoryB});

		_bus.on(EventA, (event) => Promise.reject());
		_bus.on(EventB, (event) => Promise.reject());

		await _bus.startConsumption();

		setTimeout(async () => {
			await _bus.stop();

			expect(_client.ack).toHaveBeenCalledTimes(0);
			expect(_client.nack).toHaveBeenCalledTimes(2);
			expect(_errorLogger).toHaveBeenCalledTimes(2);
			expect(_errorLogger.mock.calls[0][0]).toEqual(errorReturned);

			done();
		}, 0);
	});
});
