import {MiddlewareChain} from '../../corebus/middlewareChain';
import {Operation, OperationMiddleware} from './utils';
import {IMiddleware} from '../../index';

describe('MiddlewareChain', () => {
	let chain: MiddlewareChain<IMiddleware<number>, number>;
	let add3: IMiddleware<number>;
	let sub1: IMiddleware<number>;
	let half: IMiddleware<number>;
	let end: IMiddleware<number>;

	beforeEach(() => {
		chain = new MiddlewareChain();
		add3 = OperationMiddleware(3, Operation.Add);
		sub1 = OperationMiddleware(1, Operation.Substract);
		half = OperationMiddleware(2, Operation.Divide);
		end = OperationMiddleware(0, Operation.Void);
	});

	it('should be able to accept middlewares', () => {
		chain.push(add3);

		expect(chain.getAll()).toEqual([add3]);
	});

	it('should allow to set first and last middleware', () => {
		chain.push(add3);
		chain.unshift(half);
		chain.unshift(sub1);
		chain.push(half);

		expect(chain.getAll()).toEqual([sub1, half, add3, half]);
	});

	it('should execute the middlewares in order', (done) => {
		chain.push(add3);
		chain.unshift(half);
		chain.unshift(sub1);
		chain.push(half);

		chain.execute(29)
		.then(result => {
			expect(result).toBe(8.5);
			done();
		});
	});

	it('should execute the synchronous and asynchronous middlewares', (done) => {
		chain.push(add3);
		chain.unshift(n => n / 2);
		chain.unshift(n => n - 1);
		chain.push(half);

		chain.execute(29)
		.then(result => {
			expect(result).toBe(8.5);
			done();
		});
	});

	it('should allow to remove a middleware', (done) => {
		chain.push(add3);
		chain.unshift(half);
		chain.unshift(sub1);
		chain.push(half);

		chain.remove(sub1);

		chain.execute(29)
		.then(result => {
			expect(result).toBe(8.75);
			done();
		});
	});

	it('should stop executing if a middleware return undefined', (done) => {
		chain.push(add3);
		chain.unshift(half);
		chain.unshift(sub1);
		chain.push(end);
		chain.push(half);

		chain.execute(29)
		.then(result => {
			expect(typeof result).toBe('undefined');
			done();
		});
	});

	it('should stop executing if a middleware return undefined', (done) => {
		chain.push(add3);
		chain.unshift(half);
		chain.unshift(sub1);
		chain.push(() => {});
		chain.push(half);

		chain.execute(29)
		.then(result => {
			expect(typeof result).toBe('undefined');
			done();
		});
	});

	it('should stop executing if a middleware return Promise<undefined>', (done) => {
		chain.push(add3);
		chain.unshift(half);
		chain.unshift(sub1);
		chain.push(end);
		chain.push(half);

		chain.execute(29)
		.then(result => {
			expect(typeof result).toBe('undefined');
			done();
		});
	});

	it('should keep the ones marked to be first', (done) => {
		chain.push(add3);
		chain.unshiftAndKeepFirst(half);
		chain.unshift(sub1);
		chain.push(half);

		chain.execute(42)
		.then(result => {
			expect(result).toBe(11.5);
			done();
		});
	});

	it('should keep the ones marked to be last', (done) => {
		chain.push(add3);
		chain.pushAndKeepLast(half);
		chain.unshift(sub1);
		chain.push(half);

		chain.execute(42)
		.then(result => {
			expect(result).toBe(11);
			done();
		});
	});

	it('should not add another unshiftAndKeepFirst as first if there is already one and not force is enabled', (done) => {
		chain.push(add3);
		chain.unshiftAndKeepFirst(half);
		chain.unshiftAndKeepFirst(add3);
		chain.unshift(sub1);
		chain.push(half);

		chain.execute(44)
		.then(result => {
			expect(result).toBe(13.5);
			done();
		});
	});

	it('should not add another pushAndKeepLast as first if there is already one and not force is enabled', (done) => {
		chain.push(add3);
		chain.pushAndKeepLast(half);
		chain.pushAndKeepLast(add3);
		chain.unshift(sub1);
		chain.push(half);

		chain.execute(44)
		.then(result => {
			expect(result).toBe(13);
			done();
		});
	});

	it('should add another unshiftAndKeepFirst if there is already one and not force is enabled', (done) => {
		chain.push(add3);
		chain.unshiftAndKeepFirst(half);
		chain.unshiftAndKeepFirst(add3, true);
		chain.unshift(sub1);
		chain.push(half);

		chain.execute(44)
		.then(result => {
			expect(result).toBe(12.75);
			done();
		});
	});

	it('should add another pushAndKeepLast if there is already one and not force is enabled', (done) => {
		chain.push(add3);
		chain.pushAndKeepLast(half);
		chain.pushAndKeepLast(add3, true);
		chain.unshift(sub1);
		chain.push(half);

		chain.execute(44)
		.then(result => {
			expect(result).toBe(14.5);
			done();
		});
	});

	it('should remove from the forced first too', (done) => {
		chain.push(add3);
		chain.pushAndKeepLast(half);
		chain.pushAndKeepLast(add3, true);
		chain.unshift(sub1);
		chain.push(half);

		chain.remove(half);

		chain.execute(44)
		.then(result => {
			expect(result).toBe(49);
			done();
		});
	});

	it('should remove from the forced lasts too', (done) => {
		chain.push(add3);
		chain.unshiftAndKeepFirst(half);
		chain.unshiftAndKeepFirst(add3, true);
		chain.unshift(sub1);
		chain.push(half);

		chain.remove(half);

		chain.execute(44)
		.then(result => {
			expect(result).toBe(49);
			done();
		});
	});
});
