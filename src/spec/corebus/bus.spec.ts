import {Bus, IMiddleware} from '../../index';
import {Operation, CustomEventNumber, CustomEventOperationMiddleware, EmptyEvent} from './utils';

describe('Bus', () => {
	let bus: Bus;
	let add2: IMiddleware<CustomEventNumber>;
	let half: IMiddleware<CustomEventNumber>;
	let sub2: IMiddleware<CustomEventNumber>;
	let mul5: IMiddleware<CustomEventNumber>;
	let sub1: IMiddleware<CustomEventNumber>;
	let add3: IMiddleware<CustomEventNumber>;
	let end: IMiddleware<CustomEventNumber>;

	beforeAll(() => {
		bus = new Bus();
		add2 = CustomEventOperationMiddleware(2, Operation.Add);
		half = CustomEventOperationMiddleware(2, Operation.Divide);
		sub2 = CustomEventOperationMiddleware(2, Operation.Substract);
		mul5 = CustomEventOperationMiddleware(5, Operation.Multiply);
		sub1 = CustomEventOperationMiddleware(1, Operation.Substract);
		add3 = CustomEventOperationMiddleware(3, Operation.Add);
		end  = CustomEventOperationMiddleware(1, Operation.Void);

	});

	it('should exist', () => {
		expect(bus instanceof Bus).toBeTruthy();
	});

	it('should send and receive messages', (done) => {
		const event = new EmptyEvent();

		bus.on(EmptyEvent, (e) => {
			expect(e).toEqual(event);
			done();
		});

		bus.publish(event);
	});

	it('should send and receive messages to all subscrivers', (done) => {
		const event = new EmptyEvent();

		const fn1 = jest.fn((e) => expect(e).toBeInstanceOf(EmptyEvent));
		const fn2 = jest.fn((e) => expect(e).toBeInstanceOf(EmptyEvent));
		const fn3 = jest.fn((e) => expect(e).toBeInstanceOf(EmptyEvent));

		bus.on(EmptyEvent, fn1);
		bus.on(EmptyEvent, fn2);
		bus.on(EmptyEvent, fn3);

		bus.publish(event);

		setTimeout(() => {
			expect(fn1.mock.calls.length).toBe(1);
			expect(fn2.mock.calls.length).toBe(1);
			expect(fn3.mock.calls.length).toBe(1);
			done();
		}, 0);
	});

	it('should send and receive messages to the correct destination (inherited classes)', (done) => {
		const event = new EmptyEvent();
		class Event2 extends EmptyEvent {}
		const event2 = new Event2();

		bus.on(Event2, (e) => {
			expect(e).toBeInstanceOf(Event2);
			done();
		});

		bus.publish(event);
		bus.publish(event2);
	});

	it('should send and receive messages to the correct destination (independen classes)', (done) => {
		const event = new EmptyEvent();
		class Event2 {}
		const event2 = new Event2();

		bus.on(Event2, (e) => {
			expect(e).toBeInstanceOf(Event2);
			done();
		});

		bus.publish(event);
		bus.publish(event2);
	});

	it('should send and receive messages to the correct destination (no callbacks)', (done) => {
		const customBus = new Bus<{}>();
		const event = new EmptyEvent();
		class Event2 {}
		class Event3 {}
		const event2 = new Event2();

		const fn = jest.fn();

		customBus.on(Event3, fn);

		setTimeout(() => {
			expect(fn.mock.calls.length).toBe(0);
			done();
		}, 5);

		customBus.publish(event);
		customBus.publish(event2);
	});

	describe('Middlewares', () => {
		it('should apply the middlewares only one time', (done) => {
			const customBus = new Bus<CustomEventNumber>();
			const event = new CustomEventNumber(1);
			customBus.pushMiddleware(add2);

			customBus.on(CustomEventNumber, (eventResult) => {
				expect(eventResult.data).toBe(3);
				done();
			});

			customBus.publish(event);
		});

		it('Middlewares should be executed in the correct order', (done) => {
			const customBus = new Bus<CustomEventNumber>();
			const event = new CustomEventNumber(2);

			customBus.unshiftMiddleware(half);
			customBus.pushMiddleware(sub2);
			customBus.pushMiddleware(mul5);
			customBus.unshiftMiddleware(sub1);
			customBus.pushMiddleware(add3);

			customBus.on(CustomEventNumber, (eventResult) => {
				// (((2) + 3) * 5 - 2) / 2 - 1 = 10.5
				expect(eventResult.data).toBe(10.5);
				done();
			});

			customBus.publish(event);
		});

		it('Middlewares should stop the execution if they return void', (done) => {
			const customBus = new Bus<CustomEventNumber>();
			const event = new CustomEventNumber(2);

			customBus.unshiftMiddleware(half);
			customBus.pushMiddleware(mul5);
			// Void makes the middleware to return nothign.
			customBus.unshiftMiddleware(end);
			customBus.unshiftMiddleware(sub1);
			customBus.pushMiddleware(add3);

			const fn = jest.fn();

			customBus.on(CustomEventNumber, fn);

			customBus.publish(event);

			setTimeout(() => {
				expect(fn.mock.calls.length).toBe(0);
				done();
			}, 5);
		});
	});

	describe('Publisher', () => {
		it('should allow to have different sets of middlewares in every publisher', (done) => {
			const customBus = new Bus<CustomEventNumber>();
			const pubA = customBus.createPublisher();
			const pubB = customBus.createPublisher();
			const event = new CustomEventNumber(4);

			customBus.unshiftMiddleware(half);
			pubA.pushMiddleware(sub2);
			pubA.pushMiddleware(half);

			pubB.unshiftMiddleware(add2);
			pubB.pushMiddleware(mul5);

			const handler = jest.fn((eventResult) => Promise.resolve());

			customBus.on(CustomEventNumber, handler);

			customBus.publish(event);
			pubA.publish(event);
			pubB.publish(event);

			setTimeout(() => {
				expect(handler.mock.calls.filter(call => call[0].data === 2).length).toBe(1);
				expect(handler.mock.calls.filter(call => call[0].data === 1).length).toBe(1);
				expect(handler.mock.calls.filter(call => call[0].data === 30).length).toBe(1);
				done();
			}, 5);
		});
	});
});
