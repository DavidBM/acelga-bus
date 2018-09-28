import {EmptyTracker} from '@src/eventstore/emptyTracker';

describe('EmptyTracker', () => {
	let tracker: EmptyTracker;

	beforeEach(() => {
		tracker = new EmptyTracker();
	})

	it('should send the "empty" event when it is empty', () => {
		const handler = jest.fn();

		tracker.on('empty', handler);

		tracker.remember(1);
		expect(tracker.isEmpty()).toBe(false);
		tracker.forget(1);

		expect(handler).toHaveBeenCalledTimes(1);
		expect(tracker.isEmpty()).toBe(true);

		tracker.remember(2);
		tracker.remember(1);
		tracker.forget(1);
		tracker.forget(1);

		expect(tracker.isEmpty()).toBe(false);
		expect(handler).toHaveBeenCalledTimes(1);

		tracker.forget(2);

		expect(handler).toHaveBeenCalledTimes(2);
		expect(tracker.isEmpty()).toBe(true);
	});

	it('should wait until it is finish', (done) => {
		const timeout = jest.fn().mockImplementation(() => tracker.forget(1));

		tracker.remember(1);

		setTimeout(timeout, 50);

		tracker.waitUntilEmpty(100)
		.then(() => {
			expect(timeout).toHaveBeenCalledTimes(1);
			done();
		});
	});

	it('should fail the promise if there is a timeout', (done) => {
		const timeout = jest.fn().mockImplementation(() => tracker.forget(1));

		tracker.remember(1);

		tracker.waitUntilEmpty(100)
		.catch(() => {
			done();
		});
	});

	it('should apply timeout only if it is a positive number', (done) => {
		const timeout = jest.fn().mockImplementation(() => tracker.forget(1));

		tracker.remember(1);

		tracker.waitUntilEmpty(-10)
		.catch(() => {
			done.fail();
		});

		tracker.waitUntilEmpty('a' as any)
		.catch(() => {
			done.fail();
		});

		setTimeout(done, 200);
	});

	it('should succeed the promise if it is empty', (done) => {
		const timeout = jest.fn().mockImplementation(() => tracker.forget(1));

		tracker.waitUntilEmpty(100)
		.then(() => {
			done();
		});
	});
});