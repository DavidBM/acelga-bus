import {MiddlewareChain} from '@src/middlewareChain';
import {Operation, OperationMiddleware} from './utils';

describe("MiddlewareChain", () => {
	var chain: MiddlewareChain;
	var add3: Function;
	var sub1: Function;
	var half: Function;
	var end: Function;

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
			expect(result.item).toBe(8.5);
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
			expect(typeof result.item).toBe('undefined');
			done();
		});
	});
});
