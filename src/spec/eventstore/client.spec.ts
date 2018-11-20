import {EventstoreClient, NoHanlderToProcessEvents} from '../../eventstore/client';
import {
	createSpiedBackoff,
	createMockedSpiedEventstorelibWithNoEvents,
	createMockedSpiedEventstorelibWithCorrectEvents,
} from './mocks';
import {eventstoreResponse} from './utils';
import {IEmptyTracker} from '../../corebus/emptyTracker';
import {backoffFibonacci, BackoffExecutor} from '../../corebus/backoff';
import {EventstoreFeedbackHTTP} from '../../eventstore/interfaces';
import {decodeEventstoreResponse} from '../../eventstore/utils';
import {ErrorLogger} from '../../';
import {HTTPClient} from 'geteventstore-promise';
import {EmptyTracker} from '../../corebus/emptyTracker';

describe('eventstore Client', () => {
	let spiedBackoff: BackoffExecutor;
	let errorLogger: ErrorLogger;
	let eventstoreSignal: EventstoreFeedbackHTTP;
	let backoffSummary: {
		resetCalls: number,
		backoffCalls: number,
	};
	let tracker: IEmptyTracker;

	beforeEach(() => {
		const {backoff, summary} = createSpiedBackoff();
		backoffSummary = summary;
		spiedBackoff = backoff;
		errorLogger = jest.fn();
		eventstoreSignal = jest.fn().mockImplementation(() => Promise.resolve());
		tracker = new EmptyTracker();
	});

	it('should call the getEvents from the eventstore library', (done) => {
		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithNoEvents();
		const client = new EventstoreClient(mockedSpiedEventstore, eventstoreSignal, errorLogger, spiedBackoff, decodeEventstoreResponse, [{stream: 'a', subscription: 'a'}], tracker, 50);
		client.startConsumption();

		setTimeout(() => {
			expect(mockedSpiedEventstore.persistentSubscriptions.getEvents).toHaveBeenCalled();
			done();
		}, 50);
	});

	it('should call the getEvents from the eventstore library', () => {
		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithNoEvents();
		const client = new EventstoreClient(mockedSpiedEventstore, eventstoreSignal, errorLogger, spiedBackoff, decodeEventstoreResponse, [{stream: 'a', subscription: 'a'}], tracker, 50);
		client.ping();

		expect(mockedSpiedEventstore.ping).toHaveBeenCalled();
	});

	it('should call the getEvents from the eventstore library', () => {
		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithNoEvents();
		const client = new EventstoreClient(mockedSpiedEventstore, eventstoreSignal, errorLogger, spiedBackoff, decodeEventstoreResponse, [{stream: 'a', subscription: 'a'}], tracker, 50);
		client.ack('hola');

		expect(eventstoreSignal).toHaveBeenCalledWith('hola');
	});

	it('should call the getEvents from the eventstore library', () => {
		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithNoEvents();
		const client = new EventstoreClient(mockedSpiedEventstore, eventstoreSignal, errorLogger, spiedBackoff, decodeEventstoreResponse, [{stream: 'a', subscription: 'a'}], tracker, 50);
		client.nack('hola');

		expect(eventstoreSignal).toHaveBeenCalledWith('hola');
	});

	it('should call the getEvents and repeat if there are events', (done) => {
		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithCorrectEvents(4);
		const client = new EventstoreClient(mockedSpiedEventstore, eventstoreSignal, errorLogger, spiedBackoff, decodeEventstoreResponse, [{stream: 'a', subscription: 'a'}], tracker, 50);
		client.startConsumption();

		const handler = jest.fn();

		client.setHandler(handler);

		setTimeout(() => {
			expect(handler).toHaveBeenCalledTimes(4);
			expect(backoffSummary.backoffCalls).toBeGreaterThan(4);
			done();
		}, 500);
	});

	it('should log the error in case of exception in the handler', (done) => {
		const ERROR_TO_THROW = new Error('test');

		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithCorrectEvents(1);
		const client = new EventstoreClient(mockedSpiedEventstore, eventstoreSignal, errorLogger, spiedBackoff, decodeEventstoreResponse, [{stream: 'a', subscription: 'a'}], tracker, 50);
		client.startConsumption();

		const handler = jest.fn().mockImplementation((event) => {
			throw ERROR_TO_THROW;
		});

		client.setHandler(handler);

		setTimeout(() => {
			expect(handler).toHaveBeenCalledTimes(1);
			expect(errorLogger).toHaveBeenCalledWith(ERROR_TO_THROW)
			done();
		}, 50);
	});

	it('should log the no handler to process the event error in case of no handler provided', (done) => {
		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithCorrectEvents(2);
		const client = new EventstoreClient(mockedSpiedEventstore, eventstoreSignal, errorLogger, spiedBackoff, decodeEventstoreResponse, [{stream: 'a', subscription: 'a'}], tracker, 50);
		client.startConsumption();

		setTimeout(() => {
			expect(errorLogger).toHaveBeenCalledWith(new NoHanlderToProcessEvents(eventstoreResponse))
			expect(errorLogger).toHaveBeenCalledTimes(2);
			done();
		}, 50);
	});

	it('should call writeEvent from the client when publish is called', (done) => {
		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithNoEvents();
		const client = new EventstoreClient(mockedSpiedEventstore, eventstoreSignal, errorLogger, spiedBackoff, decodeEventstoreResponse, [{stream: 'a', subscription: 'a'}], tracker, 50);
		client.startConsumption();

		client.publish('test', 'test', {})

		setTimeout(() => {
			expect(mockedSpiedEventstore.writeEvent).toHaveBeenCalledWith('test', 'test', {})
			expect(mockedSpiedEventstore.writeEvent).toHaveBeenCalledTimes(1);
			done();
		}, 50);
	});

	it('should do one call for each iteration with the correct backoff', (done) => {
		const backoff = backoffFibonacci({
			randomisationFactor: 0,
			initialDelay: 20,
			maxDelay: 50,
		});

		const handler = jest.fn();

		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithNoEvents();
		const client = new EventstoreClient(mockedSpiedEventstore, eventstoreSignal, errorLogger, backoff, decodeEventstoreResponse, [{stream: 'a', subscription: 'a'}], tracker, 50);
		client.startConsumption();

		client.setHandler(handler);

		setTimeout(() => {
			// 5 times for: initial 20ms 20ms 40ms 50ms = 130ms (with the normal timeout exactitude, we can assume that we can have 5 calls in 150 ms)
			expect(mockedSpiedEventstore.persistentSubscriptions.getEvents).toHaveBeenCalledTimes(5)
			done();
		}, 150);
	});

	it('should stop once all events are processed', (done) => {
		const handlerTimeout = jest.fn();
		const handler = jest.fn((events: any): Promise<void> => {
			return new Promise<void>(resolve => {
				setTimeout(() => {
					handlerTimeout();
					resolve();
				}, 75);
			});
		});

		const before = Date.now();

		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithCorrectEvents(1);
		const client = new EventstoreClient(mockedSpiedEventstore, eventstoreSignal, errorLogger, spiedBackoff, decodeEventstoreResponse, [{stream: 'a', subscription: 'a'}], tracker, 50000000);
		client.startConsumption();

		client.setHandler(handler);

		setTimeout(() => {
			client.stop()
			.then(() => {
				expect(handler).toHaveBeenCalledTimes(1);
				expect(handlerTimeout).toHaveBeenCalledTimes(1);
				done();
			});			
		}, 10);
	});

	it('should stop once all events are processed (reject)', (done) => {
		const handlerTimeout = jest.fn();
		const handler = jest.fn((events: any): Promise<void> => {
			return new Promise<void>((resolve, reject) => {
				setTimeout(() => {
					handlerTimeout();
					reject();
				}, 75);
			});
		});

		const before = Date.now();

		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithCorrectEvents(1);
		const client = new EventstoreClient(mockedSpiedEventstore, eventstoreSignal, errorLogger, spiedBackoff, decodeEventstoreResponse, [{stream: 'a', subscription: 'a'}], tracker, 50000000);
		client.startConsumption();

		client.setHandler(handler);

		setTimeout(() => {
			client.stop()
			.then(() => {
				expect(handler).toHaveBeenCalledTimes(1);
				expect(handlerTimeout).toHaveBeenCalledTimes(1);
				done();
			});			
		}, 10);
	});

	it('should stop once all events are processed', (done) => {
		const handlerTimeout = jest.fn();
		const handler = jest.fn((events: any): Promise<void> => {
			return new Promise<void>(resolve => {
				setTimeout(() => {
					handlerTimeout();
					resolve();
				}, 75);
			});
		});

		const before = Date.now();

		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithCorrectEvents(1);
		const client = new EventstoreClient(mockedSpiedEventstore, eventstoreSignal, errorLogger, spiedBackoff, decodeEventstoreResponse, [{stream: 'a', subscription: 'a'}], tracker, 50);
		client.startConsumption();

		client.setHandler(handler);

		setTimeout(() => {
			client.stop()
			.then(() => {
				expect(handler).toHaveBeenCalled();
				expect(handlerTimeout).not.toHaveBeenCalled();
				done();
			});			
		}, 10);
	});
});
