import {EventstoreClient, NoHanlderToProcessEvents} from '@src/eventstore/eventstoreClient';
import {
	createSpiedBackoff,
	createMockedSpiedEventstorelibWithNoEvents,
	createMockedSpiedEventstorelibWithCorrectEvents,
} from './mocks';
import {eventstoreResponse} from './utils';
import {backoffFibonacci} from '@src/eventstore/backoff';

import {BackoffExecutor} from '@src/eventstore/backoff';
import {ErrorLogger} from '../../';
import {HTTPClient} from 'geteventstore-promise';

describe('eventstore Client', () => {
	let spiedBackoff: BackoffExecutor;
	let errorLogger: ErrorLogger;
	let backoffSummary: {
		resetCalls: number,
		backoffCalls: number,
	};

	beforeEach(() => {
		let {backoff, summary} = createSpiedBackoff();
		backoffSummary = summary;
		spiedBackoff = backoff;
		errorLogger = jest.fn();
	});

	it('should call the getEvents from the eventstore library', (done) => {
		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithNoEvents();
		const client = new EventstoreClient(mockedSpiedEventstore, errorLogger, spiedBackoff, [{stream: 'a', subscription: 'a'}]);

		setTimeout(() => {
			expect(mockedSpiedEventstore.persistentSubscriptions.getEvents).toHaveBeenCalled();
			done();
		}, 50);
	});

	it('should call the getEvents and repeat if there are events', (done) => {
		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithCorrectEvents(4);
		const client = new EventstoreClient(mockedSpiedEventstore, errorLogger, spiedBackoff, [{stream: 'a', subscription: 'a'}]);

		const handler = jest.fn();

		client.setHandler(handler);

		setTimeout(() => {
			expect(handler).toHaveBeenCalledTimes(4);
			expect(backoffSummary.backoffCalls).toBeGreaterThan(4);
			done();
		}, 50);
	});

	it('should log the error in case of exception in the handler', (done) => {
		const ERROR_TO_THROW = new Error('test');

		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithCorrectEvents(1);
		const client = new EventstoreClient(mockedSpiedEventstore, errorLogger, spiedBackoff, [{stream: 'a', subscription: 'a'}]);

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
		const client = new EventstoreClient(mockedSpiedEventstore, errorLogger, spiedBackoff, [{stream: 'a', subscription: 'a'}]);

		setTimeout(() => {
			expect(errorLogger).toHaveBeenCalledWith(new NoHanlderToProcessEvents(eventstoreResponse))
			expect(errorLogger).toHaveBeenCalledTimes(2);
			done();
		}, 50);
	});

	it('should call writeEvent from the client when publish is called', (done) => {
		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithNoEvents();
		const client = new EventstoreClient(mockedSpiedEventstore, errorLogger, spiedBackoff, [{stream: 'a', subscription: 'a'}]);

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
			initialDelay: 10,
			maxDelay: 50,
		});

		const handler = jest.fn();

		const mockedSpiedEventstore = createMockedSpiedEventstorelibWithNoEvents();
		const client = new EventstoreClient(mockedSpiedEventstore, errorLogger, backoff, [{stream: 'a', subscription: 'a'}]);

		client.setHandler(handler);

		setTimeout(() => {
			// 6 times for: initial 10ms 10ms 20ms 30ms 50ms = 120ms (with the normal timeout exactitude, we can assume that we can have 6 calls in 130 ms)
			expect(mockedSpiedEventstore.persistentSubscriptions.getEvents).toHaveBeenCalledTimes(6)
			done();
		}, 130);
	});
});
