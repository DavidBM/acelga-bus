import {create} from '../../simplegooglepubsub/factory';
import {GoogleFacade} from '../../simplegooglepubsub/facade';

describe('Google pub sub factory', () => {
	it('should create the facade class', () => {
		const bus = create(__dirname + '/serviceaccount.test.json', 'project_name', []);

		expect(bus).toBeInstanceOf(GoogleFacade);
	});
});
