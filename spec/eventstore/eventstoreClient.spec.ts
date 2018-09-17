import {EventstoreClient} from '@src/eventstore/eventstoreClient';
import {
	createSpiedBackoff,
	createMockedSpiedEventstorelibWithNoEvents,
	createMockedSpiedEventstorelibWithCorrectEvents,
} from './mocks';

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
		}, 200);
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
		}, 500);
	});
});
