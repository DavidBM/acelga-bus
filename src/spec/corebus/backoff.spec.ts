import {BackoffWrapper} from '../../corebus/backoff';

describe('Backoff', () => {
	const options = {
		randomisationFactor: 0,
		initialDelay: 1,
		maxDelay: 10,
		factor: 1,
	};

	it('should not trigger two times backoff internally', (done) => {
		const backoff = new BackoffWrapper((continuing, cancelling) => {
			setTimeout(() => {
				continuing();
				continuing();
				continuing();
				continuing();
			}, 10);
		}, options);

		jest.spyOn(backoff.backoffStrategy, 'backoff');

		setTimeout(() => {
			expect(backoff.backoffStrategy.backoff).toHaveBeenCalledTimes(1);
			done();
		}, 20);
	});
});
