import {Pipeline} from '@src/corebus/pipeline';
import {Dispatcher} from '@src/corebus/dispatchers/single';

class EventA {}
class EventB {}

try {

} catch(error) {
	if(error instanceof Error)
		throw error;

	throw new Error(error);
					
}

describe('Pipeline', () => {
	let pipeline: Pipeline<any>;
	let dispatcher: Dispatcher<any>;

	beforeEach(() => {
		dispatcher = new Dispatcher<any>();
		pipeline = new Pipeline<any>(dispatcher);
	});

	describe('executeStopOnError', () => {
		it('should stop on error', async () => {
			const eventACallback = jest.fn(() => { throw new Error('Hola'); });
			const eventBCallback = jest.fn(() => Promise.resolve() );

			dispatcher.on(EventA, eventACallback);
			dispatcher.on(EventB, eventBCallback);

			const errors = await pipeline.executeStopOnError([new EventA(), new EventB()]);

			expect(eventACallback).toHaveBeenCalledTimes(1);
			expect(eventBCallback).toHaveBeenCalledTimes(0);

			expect(errors).toBeInstanceOf(Array);

			if (!Array.isArray(errors)) return;

			expect(errors.length).toBe(2);
			expect(errors[0].error).toEqual(new Error('Hola'));
			expect(errors[0].event).toBeInstanceOf(EventA);
		});

		it('should stop on a rejected promise', async () => {
			const eventACallback = jest.fn(() => Promise.reject(new Error('Hola')) );
			const eventBCallback = jest.fn(() => Promise.resolve() );

			dispatcher.on(EventA, eventACallback);
			dispatcher.on(EventB, eventBCallback);

			const errors = await pipeline.executeStopOnError([new EventA(), new EventB()]);

			expect(eventACallback).toHaveBeenCalledTimes(1);
			expect(eventBCallback).toHaveBeenCalledTimes(0);

			expect(errors).toBeInstanceOf(Array);

			if (!Array.isArray(errors)) return;

			expect(errors.length).toBe(2);
			expect(errors[0].error).toEqual(new Error('Hola'));
			expect(errors[0].event).toBeInstanceOf(EventA);
		});

		it('should not stop if there is no error', async () => {
			const eventACallback = jest.fn(() => Promise.resolve() );
			const eventBCallback = jest.fn(() => Promise.resolve() );

			dispatcher.on(EventA, eventACallback);
			dispatcher.on(EventB, eventBCallback);

			const errors = await pipeline.executeStopOnError([new EventA(), new EventB()]);

			expect(eventACallback).toHaveBeenCalledTimes(1);
			expect(eventBCallback).toHaveBeenCalledTimes(1);

			expect(errors).toBeUndefined();
		});

		it('should return the rest of non processed events as error in case of error (case Promise rejected)', async () => {
			const eventACallback = jest.fn(() => Promise.reject() );
			const eventBCallback = jest.fn(() => Promise.resolve() );

			dispatcher.on(EventA, eventACallback);
			dispatcher.on(EventB, eventBCallback);
			dispatcher.on(EventB, eventBCallback);

			const errors = await pipeline.executeStopOnError([new EventA(), new EventB(), new EventB()]);

			expect(eventACallback).toHaveBeenCalledTimes(1);
			expect(eventBCallback).toHaveBeenCalledTimes(0);

			if (!Array.isArray(errors)) return;

			expect(errors.length).toBe(3);
		});

		it('should return the rest of non processed events as error in case of error (case throw)', async () => {
			const eventACallback = jest.fn(() => { throw new Error('hola'); });
			const eventBCallback = jest.fn(() => Promise.resolve() );

			dispatcher.on(EventA, eventACallback);
			dispatcher.on(EventB, eventBCallback);

			const errors = await pipeline.executeStopOnError([new EventA(), new EventB(), new EventB()]);

			expect(eventACallback).toHaveBeenCalledTimes(1);
			expect(eventBCallback).toHaveBeenCalledTimes(0);

			if (!Array.isArray(errors)) return;

			expect(errors.length).toBe(3);
		});
	});

	describe('executeContinueOnError', () => {
		it('should stop on error', async () => {
			const eventACallback = jest.fn(() => { throw new Error('Hola'); });
			const eventBCallback = jest.fn(() => Promise.resolve() );

			dispatcher.on(EventA, eventACallback);
			dispatcher.on(EventB, eventBCallback);

			const errors = await pipeline.executeContinueOnError([new EventA(), new EventB()]);

			expect(eventACallback).toHaveBeenCalledTimes(1);
			expect(eventBCallback).toHaveBeenCalledTimes(1);

			expect(errors).toBeInstanceOf(Array);

			if (!Array.isArray(errors)) return;

			expect(errors.length).toBe(1);
			expect(errors[0].error).toEqual(new Error('Hola'));
			expect(errors[0].event).toBeInstanceOf(EventA);
		});

		it('should stop on a rejected promise', async () => {
			const eventACallback = jest.fn(() => Promise.reject(new Error('Hola')) );
			const eventBCallback = jest.fn(() => Promise.resolve() );

			dispatcher.on(EventA, eventACallback);
			dispatcher.on(EventB, eventBCallback);

			const errors = await pipeline.executeContinueOnError([new EventA(), new EventB()]);

			expect(eventACallback).toHaveBeenCalledTimes(1);
			expect(eventBCallback).toHaveBeenCalledTimes(1);

			expect(errors).toBeInstanceOf(Array);

			if (!Array.isArray(errors)) return;

			expect(errors.length).toBe(1);
			expect(errors[0].error).toEqual(new Error('Hola'));
			expect(errors[0].event).toBeInstanceOf(EventA);
		});

		it('should not stop if there is no error', async () => {
			const eventACallback = jest.fn(() => Promise.resolve());
			const eventBCallback = jest.fn(() => Promise.resolve() );

			dispatcher.on(EventA, eventACallback);
			dispatcher.on(EventB, eventBCallback);

			const errors = await pipeline.executeContinueOnError([new EventA(), new EventB()]);

			expect(eventACallback).toHaveBeenCalledTimes(1);
			expect(eventBCallback).toHaveBeenCalledTimes(1);

			expect(errors).toBeUndefined();
		});
	});
});
