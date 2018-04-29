import {MiddlewareChain} from '@src/corebus/middlewareChain';
import {Operation, OperationMiddleware} from './utils';
import {IMiddleware} from '@src/index';

describe("MiddlewareChain", () => {
	var chain: MiddlewareChain<IMiddleware<number>, number>;
	var add3: IMiddleware<number>;
	var sub1: IMiddleware<number>;
	var half: IMiddleware<number>;
	var end: IMiddleware<number>;

	beforeEach(() => {
		chain = new MiddlewareChain();
		add3 = OperationMiddleware(3, Operation.Add);
		sub1 = OperationMiddleware(1, Operation.Substract);
		half = OperationMiddleware(2, Operation.Divide);
		end = OperationMiddleware(0, Operation.Void);
	});

	it("should be able to accept middlewares", () => {
		chain.push(add3);

		expect(chain.getAll()).toEqual([add3]);
	});

	it("should allow to set first and last middleware", () => {
		chain.push(add3);
		chain.unshift(half);
		chain.unshift(sub1);
		chain.push(half);

		expect(chain.getAll()).toEqual([sub1, half, add3, half]);
	});

	it("should execute the middlewares in order", (done) => {
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

	it("should execute the synchronous and asynchronous middlewares", (done) => {
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

	it("should allow to remove a middleware", (done) => {
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

	it("should stop executing if a middleware return undefined", (done) => {
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

	it("should stop executing if a middleware return undefined", (done) => {
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

	it("should stop executing if a middleware return Promise<undefined>", (done) => {
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
});
