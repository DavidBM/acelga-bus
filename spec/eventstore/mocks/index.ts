import * as Backoff from 'backoff';
import {HTTPClient} from 'geteventstore-promise';
import {eventstoreResponse} from '../utils';

export function createSpiedBackoff(initialDelay: number = 1, maxDelay: number = 10) {
	const backoff = Backoff.fibonacci({
		randomisationFactor: 0,
		initialDelay,
		maxDelay,
	});

	jest.spyOn(backoff, 'on');
	jest.spyOn(backoff, 'reset');
	jest.spyOn(backoff, 'backoff');

	return backoff;
}

export function createMockedSpiedEventstorelibWithNoEvents() {
	const client = new HTTPClient({hostname: 'localhost', port: 2113, credentials: {username: 'admin', password: 'changeit'}});

	jest.spyOn(client.persistentSubscriptions, 'getEvents').mockImplementation(() => Promise.resolve({entries: []}));
	jest.spyOn(client, 'writeEvent').mockImplementation(() => Promise.resolve());

	return client;
}

export function createMockedSpiedEventstorelibWithCorrectEvents(times: number = 1) {
	const client = new HTTPClient({hostname: 'localhost', port: 2113, credentials: {username: 'admin', password: 'changeit'}});
	let counter = 0;

	jest.spyOn(client.persistentSubscriptions, 'getEvents').mockImplementation(() => {
		if (counter >= times) return Promise.resolve({entries: []});
		counter++;
		return Promise.resolve(eventstoreResponse);
	});

	jest.spyOn(client, 'writeEvent').mockImplementation(() => Promise.resolve());

	return client;
}

