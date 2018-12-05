import {create} from '../../eventstore/index';
import {Facade} from '../../eventstore/facade';

const CONNECTION_OPTIONS = {hostname: 'localhost', port: 2113, credentials: {username: 'admin', password: 'changeit'}};

describe('eventstore factory', () => {
	it('should return an Facade instance', () => {
		const bus = create(CONNECTION_OPTIONS, []);
		expect(bus).toBeInstanceOf(Facade);
	});
});
