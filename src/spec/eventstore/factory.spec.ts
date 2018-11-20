import {create} from '../../eventstore/index';
import {EventStoreBus} from '../../eventstore/bus';

const CONNECTION_OPTIONS = {hostname: 'localhost', port: 2113, credentials: {username: 'admin', password: 'changeit'}};

describe('eventstore factory', () => {
	it('should return an eventstoreBus instance', () => {
		const bus = create(CONNECTION_OPTIONS, []);
		expect(bus).toBeInstanceOf(EventStoreBus);
	});
});
