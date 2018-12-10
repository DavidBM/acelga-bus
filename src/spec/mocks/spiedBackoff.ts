import * as BackoffOriginall from 'backoff';
import {backoffFibonacci} from '../../corebus/backoff';

export function createSpiedBackoff(initialDelay: number = 1, maxDelay: number = 10) {
	const summary = {
		resetCalls: 0,
		backoffCalls: 0,
	};

	const backoff = backoffFibonacci({
		randomisationFactor: 0,
		initialDelay,
		maxDelay,
	}, (options) => {
		const back = BackoffOriginall.fibonacci(options);

		const originalReset = back.reset;
		const originalBackoff = back.backoff;

		jest.spyOn(back, 'reset').mockImplementation(() => {
			summary.resetCalls++;
			originalReset.call(back);
		});
		jest.spyOn(back, 'backoff').mockImplementation(() => {
			summary.backoffCalls++;
			originalBackoff.call(back);
		});

		return back;
	});

	return {backoff, summary};
}
