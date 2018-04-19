import {Bus, IEvent, IMiddleware, Publisher} from '@src/index'; 
import {Operation, CustomEventNumber, CustomEventOperationMiddleware, EmptyEvent} from './utils';

describe('Bus', () => {
	var bus: Bus;
	var add2: IMiddleware<CustomEventNumber>;
	var half: IMiddleware<CustomEventNumber>;
	var sub2: IMiddleware<CustomEventNumber>;
	var mul5: IMiddleware<CustomEventNumber>;
	var sub1: IMiddleware<CustomEventNumber>;
	var add3: IMiddleware<CustomEventNumber>;
	var end: IMiddleware<CustomEventNumber>;

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

	it("should exist", () => {
		expect(bus instanceof Bus).toBeTruthy();
	});

	it("should send and receive messages", (done) => {
		var event = new EmptyEvent();

		bus.on(EmptyEvent, (e) => {
			expect(e).toEqual(event);
			done();
		});

		bus.publish(event);
	});

	it("should send and receive messages to all subscrivers", (done) => {
		var event = new EmptyEvent();

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

	it("should send and receive messages to the correct destination (inherited classes)", (done) => {
		var event = new EmptyEvent();
		class Event2 extends EmptyEvent {};
		var event2 = new Event2;

		bus.on(Event2, (e) => {
			expect(e).toBeInstanceOf(Event2);
			done();
		});

		bus.publish(event);
		bus.publish(event2);
	});

	it("should send and receive messages to the correct destination (independen classes)", (done) => {
		var event = new EmptyEvent();
		class Event2 {};
		var event2 = new Event2;

		bus.on(Event2, (e) => {
			expect(e).toBeInstanceOf(Event2);
			done();
		});

		bus.publish(event);
		bus.publish(event2);
	});

	it("should send and receive messages to the correct destination (no callbacks)", (done) => {
		const bus = new Bus<{}>();
		var event = new EmptyEvent();
		class Event2 {};
		class Event3 {};
		var event2 = new Event2;
		var event3 = new Event3;

		var fn = jest.fn();

		bus.on(Event3, fn);

		setTimeout(() => {
			expect(fn.mock.calls.length).toBe(0);
			done();
		}, 5);

		bus.publish(event);
		bus.publish(event2);
	});

	describe('Middlewares', () => {
		it("should apply the middlewares only one time", (done) => {
			const bus = new Bus<CustomEventNumber>();
			const event = new CustomEventNumber(1);
			bus.pushMiddleware(add2);

			bus.on(CustomEventNumber, (event) => {
				expect(event.data).toBe(3);
				done();
			})

			bus.publish(event);
		});
		
		it('Middlewares should be executed in the correct order', (done) => {
			const bus = new Bus<CustomEventNumber>();
			const event = new CustomEventNumber(2);

			bus.unshiftMiddleware(half);
			bus.pushMiddleware(sub2);
			bus.pushMiddleware(mul5);
			bus.unshiftMiddleware(sub1);
			bus.pushMiddleware(add3);

			bus.on(CustomEventNumber, (event) => {
				//(((2) + 3) * 5 - 2) / 2 - 1 = 10.5
				expect(event.data).toBe(10.5);
				done();
			})

			bus.publish(event);
		})
		
		it('Middlewares should stop the execution if they return void', (done) => {
			const bus = new Bus<CustomEventNumber>();
			const event = new CustomEventNumber(2);

			bus.unshiftMiddleware(half);
			bus.pushMiddleware(mul5);
			//Void makes the middleware to return nothign.
			bus.unshiftMiddleware(end);
			bus.unshiftMiddleware(sub1);
			bus.pushMiddleware(add3);

			const fn = jest.fn();

			bus.on(CustomEventNumber, fn);

			bus.publish(event);

			setTimeout(() => {
				expect(fn.mock.calls.length).toBe(0);
				done();
			}, 5);
		})
	});

	describe("Publisher", () => {
		it("should allow to have different sets of middlewares in every publisher", (done) => {
			const bus = new Bus<CustomEventNumber>();
			const pubA = bus.createPublisher();
			const pubB = bus.createPublisher();
			const event = new CustomEventNumber(4);

			bus.unshiftMiddleware(half);
			pubA.pushMiddleware(sub2);
			pubA.pushMiddleware(half);

			pubB.unshiftMiddleware(add2);
			pubB.pushMiddleware(mul5);

			const handler = jest.fn((event) => Promise.resolve());

			bus.on(CustomEventNumber, handler);

			bus.publish(event);
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

	describe("Receiver", () => {
		it("should allow to have different sets of middlewares in every receiver", (done) => {
			const bus = new Bus<CustomEventNumber>();
			const recA = bus.createReceiver();
			const recB = bus.createReceiver();
			const event = new CustomEventNumber(4);

			recA.pushMiddleware((n) => Promise.resolve(new CustomEventNumber(n.data - 2)));
			recA.pushMiddleware((n) => Promise.resolve(new CustomEventNumber(n.data / 2)));

			recB.unshiftMiddleware((n) => Promise.resolve(new CustomEventNumber(n.data + 2)));
			recB.pushMiddleware((n) => Promise.resolve(new CustomEventNumber(n.data * 5)));

			const handler = jest.fn((event) => Promise.resolve());

			recA.on(CustomEventNumber, handler);
			recB.on(CustomEventNumber, handler);

			bus.publish(event);

			setTimeout(() => {
				console.log(handler.mock.calls);
				expect(handler.mock.calls.filter(call => call[0].data === 1).length).toBe(1);
				expect(handler.mock.calls.filter(call => call[0].data === 30).length).toBe(1);
				done();
			}, 5);
		});
	});
});
