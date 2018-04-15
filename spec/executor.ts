import 'jest';
import {Executor} from	'@src/executor';
import {Event} from	'@src/index';

describe("Executor", () => {
	it("Should execute all functions and then finish", (done) => {
		const ITEMS_QUANTITY = 3;
		const {callbacks, item, executor} = createBaseExecutor(ITEMS_QUANTITY);

		executor.execStopOnFail()
		.then(() => {
			expect(Array.isArray(callbacks)).toBeTruthy();
			expect(callbacks.length).toBe(ITEMS_QUANTITY);			

			callbacks.forEach(callback => {
				expect(callback.mock.calls.length).toBe(1);
			});

			done();
		});
	});

	it("Should allow to add callbacks once created", (done) => {
		const ITEMS_QUANTITY = 3;
		const {
			callbacks, 
			executor, 
			item, 
			callbackFactory
		} = createBaseExecutor(ITEMS_QUANTITY);

		const fn1 = callbackFactory(item);
		const fn2 = callbackFactory(item);

		executor.add(fn1);
		executor.add(fn2);

		executor.execStopOnFail()
		.then(() => {	
			callbacks.forEach(callback => {
				expect(callback.mock.calls.length).toBe(1);
			});

			expect(fn1.mock.calls.length).toBe(1);
			expect(fn2.mock.calls.length).toBe(1);
			done();
		});
	});

	it("Should stop in case of error", (done) => {
		const ITEMS_QUANTITY = 3;
		const {callbacks, executor} = createBaseExecutor(ITEMS_QUANTITY, (item) => {throw new Error("artifical_error");});

		executor.execStopOnFail()
		.catch((e) => {		
			expect(callbacks.filter(cb => cb.mock.calls.length === 1).length).toBe(1);
			expect(callbacks.filter(cb => cb.mock.calls.length === 0).length).toBe(2);

			expect(e).toBeInstanceOf(Error);
			expect(e.message).toBe('artifical_error');
			done();	
		});
	});
});

function createBaseExecutor(len: number, cb?: (item: string) => Promise<any>|void) {
	const item = Math.random() + "";

	let callbackFactory = (itemToTest:string) => jest.fn((item: string) => {
		expect(item).toBe(itemToTest);
	});

	if(cb) callbackFactory = (itemToTest:string) => jest.fn(cb);

	const callbacks = new Array(len).fill(item).map(callbackFactory)

	const executor = new Executor<string>(item, ...callbacks);

	return {callbacks, item, executor, callbackFactory};
}