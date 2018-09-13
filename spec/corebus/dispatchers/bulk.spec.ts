import {IScheduler, ErrorLogger} from '@src/corebus/interfaces';
import {Dispatcher} from '@src/corebus/dispatchers/single';
import BulkDispatcher from '@src/corebus/dispatchers/bulk';
import ParallelScheduler from '@src/corebus/schedulers/parallel';
import {pipelineFactory} from '@src/corebus/pipeline/factory';
import {pipelineThrowErrorFactory} from '../mocks/pipelineThrowError';
import {pipelinePromiseRejectFactory} from '../mocks/pipelinePromiseReject';
import SequentialScheduler from '@src/corebus/schedulers/sequential';
import {NotExecutedByOrderDependency} from '@src/corebus/pipeline';

class CustomEvent{}
class OtherEvent{}

describe('BulkDispatcher', () => {
	let dispatcher: Dispatcher<any>;
	let scheduler: IScheduler<any>;
	let bulkDispatcher: BulkDispatcher<any>;
	let errorLogger: ErrorLogger;

	beforeEach(() => {
		scheduler = new ParallelScheduler();
		errorLogger = async (error) => {};
		dispatcher = new Dispatcher();
		bulkDispatcher = new BulkDispatcher(dispatcher, scheduler, pipelineFactory, errorLogger);
	});

	it('should dispatch the event to the correct handler', (done) => {
		const handler1 = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});
		const handler11 = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});
		const handler2 = jest.fn((event) => {
			expect(event).toBeInstanceOf(OtherEvent);
			return Promise.resolve();
		});
		const handlerAny = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});

		bulkDispatcher.on(CustomEvent, handler1);
		bulkDispatcher.on(CustomEvent, handler2);
		bulkDispatcher.off(CustomEvent, handler2);
		bulkDispatcher.on(CustomEvent, handler11);
		bulkDispatcher.on(OtherEvent, handler2);
		bulkDispatcher.onAny(handlerAny);

		bulkDispatcher.trigger([new CustomEvent()])
		.then(() => {
			expect(handler1.mock.calls.length).toBe(1);
			expect(handler11.mock.calls.length).toBe(1);
			expect(handler2.mock.calls.length).toBe(0);
			expect(handlerAny.mock.calls.length).toBe(1);
			done();
		});
	});

	it('should recognize when a event is already subscribed', () => {
		const handler1 = jest.fn((event) => {
			return Promise.resolve();
		});

		bulkDispatcher.on(CustomEvent, handler1);

		expect(bulkDispatcher.isListened(CustomEvent)).toBe(true);
		expect(bulkDispatcher.isListened(OtherEvent)).toBe(false);
	});

	it('should return the errors in case of error in the handlers', (done) => {
		const handler1 = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});
		const handler11 = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			throw new Error('hola');
		});

		bulkDispatcher.on(CustomEvent, handler1);
		bulkDispatcher.on(CustomEvent, handler11);

		bulkDispatcher.trigger([new CustomEvent()])
		.then(errors => {
			expect(errors).toEqual([{error: new Error('hola'), event: new CustomEvent(), isError: true}]);
			expect(handler1.mock.calls.length).toBe(1);
			expect(handler11.mock.calls.length).toBe(1);
			done();
		});
	});

	it('should return the errors in case of rejected promise in the handlers', (done) => {
		const okHandler = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});
		const okHandler2 = jest.fn((event) => {
			expect(event).toBeInstanceOf(OtherEvent);
			return Promise.resolve();
		});
		const rejecHandler = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.reject(new Error('hola'));
		});

		bulkDispatcher.on(CustomEvent, okHandler);
		bulkDispatcher.on(CustomEvent, rejecHandler);
		bulkDispatcher.on(OtherEvent, okHandler2);

		bulkDispatcher.trigger([new CustomEvent(), new OtherEvent(), new CustomEvent(), new OtherEvent()])
		.then(errors => {
			expect(errors).toEqual([
				{error: new Error('hola'), event: new CustomEvent(), isError: true},
				{error: null, event: new CustomEvent(), isError: false},
				{error: new Error('hola'), event: new CustomEvent(), isError: true},
				{error: null, event: new CustomEvent(), isError: false}
			]);
			expect(okHandler.mock.calls.length).toBe(2);
			expect(rejecHandler.mock.calls.length).toBe(2);
			done();
		});
	});

	it('should return the error via catch in case of internal error (case pipeline throw error)', (done) => {
		const customErrorLogger = jest.fn(errorLogger);
		const customBulkDispatcher = new BulkDispatcher(dispatcher, scheduler, pipelineThrowErrorFactory, customErrorLogger);

		const handler2 = jest.fn((event) => {
			expect(event).toBeInstanceOf(OtherEvent);
			return Promise.resolve();
		});

		customBulkDispatcher.on(OtherEvent, handler2);

		customBulkDispatcher.trigger([new OtherEvent()])
		.catch(errors => {
			expect(customErrorLogger).toHaveBeenCalledTimes(1);
			expect(errors).toEqual(new Error('executeContinueOnError'));
			expect(handler2.mock.calls.length).toBe(0);
			done();
		});
	});

	it('should return the errors via then in case of internal error (case pipeline promise reject)', (done) => {
		const customErrorLogger = jest.fn(errorLogger);
		const customBulkDispatcher = new BulkDispatcher(dispatcher, scheduler, pipelinePromiseRejectFactory, customErrorLogger);

		const handler1 = jest.fn((event) => {
			expect(event).toBeInstanceOf(OtherEvent);
			return Promise.reject(new Error("Hola"));
		});
		const handler2 = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});

		customBulkDispatcher.on(OtherEvent, handler1);
		customBulkDispatcher.on(CustomEvent, handler2);

		customBulkDispatcher.trigger([new OtherEvent(), new CustomEvent()])
		.then((value) => {
			expect(customErrorLogger).toHaveBeenCalledTimes(2);
			expect(customErrorLogger.mock.calls[0][0]).toBeInstanceOf(Error);
			expect(handler2.mock.calls.length).toBe(0);
			done();
		});
	});

	it('should stop if preserve order is true', (done) => {
		const customerScheduler = new SequentialScheduler(true);
		const customBulkDispatcher = new BulkDispatcher(dispatcher, customerScheduler, pipelineFactory, errorLogger);

		const handler1 = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});

		const handler2 = jest.fn((event) => {
			expect(event).toBeInstanceOf(OtherEvent);
			return Promise.reject();
		});

		customBulkDispatcher.on(CustomEvent, handler1);
		customBulkDispatcher.on(OtherEvent, handler2);

		customBulkDispatcher.trigger([new OtherEvent(), new OtherEvent(), new CustomEvent(), new OtherEvent()])
		.then(errors => {
			expect(errors).toEqual([{
				error: undefined,
				event: new OtherEvent(),
				isError: true,
			}, {
				error: new NotExecutedByOrderDependency(),
				event: new OtherEvent(),
				isError: true,
			}, {
				error: new NotExecutedByOrderDependency(),
				event: new CustomEvent(),
				isError: true,
			}, {
				error: new NotExecutedByOrderDependency(),
				event: new OtherEvent(),
				isError: true,
			}]);
			expect(handler2.mock.calls.length).toBe(1);
			done();
		});
	});
});
