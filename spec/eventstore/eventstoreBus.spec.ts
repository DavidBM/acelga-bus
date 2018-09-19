import {createSpiedMockedEventstoreClient} from './mocks'
import {EventstoreClient} from '@src/eventstore/eventstoreClient';

describe('EventstoreBus', () => {
	let client: EventstoreClient;

	beforeEach(() => {
		let {
			client,
			backoffSummary,
			errorLogger,
			evClient,
		} = createSpiedMockedEventstoreClient(1);
	});
});