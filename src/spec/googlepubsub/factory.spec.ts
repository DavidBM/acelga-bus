import {create} from '../../googlepubsub/index';
import {GooglePubSub} from '../../googlepubsub/bus';

const CONNECTION_OPTIONS = {hostname: 'localhost', port: 2113, credentials: {username: 'admin', password: 'changeit'}};

describe('GoogleBus factory', () => {
	it('should return an GooglePubSub instance', () => {
		const bus = create(CONNECTION_OPTIONS, []);
		expect(bus).toBeInstanceOf(GooglePubSub);
	});
});
