import {EventstoreClient} from '@src/eventstore/eventstoreClient';
import {
	createSpiedBackoff,
	createMockedSpiedEventstorelibWithNoEvents,
	createMockedSpiedEventstorelibWithCorrectEvents,
} from './mocks';

import {Backoff} from 'backoff';
import {ErrorLogger} from '../../';
import {HTTPClient} from 'geteventstore-promise';

describe('eventstore Client', () => {
	let spiedBackoff: Backoff;
	let errorLogger: ErrorLogger;

	beforeEach(() => {
		spiedBackoff = createSpiedBackoff();
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
			spiedBackoff.removeAllListeners();
			spiedBackoff.reset();
			done();
		}, 500);
	});
});
