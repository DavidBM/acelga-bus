import {Bus, Event, IMiddleware} from '@src/index'; 

describe('Bus', () => {
	var bus: Bus;

	beforeAll(() => {
		bus = new Bus();
	});

	it("should exist", () => {
		expect(bus instanceof Bus).toBeTruthy();
	});

	it("should send and receive messages", (done) => {
		var event = new Event();

		bus.on(Event, (e) => {
			expect(e).toEqual(event);
			done();
		});

		bus.publish(event);
	});

	it("should send and receive messages to all subscrivers", (done) => {
		var event = new Event();

		const fn1 = jest.fn((e) => expect(e).toBeInstanceOf(Event));
		const fn2 = jest.fn((e) => expect(e).toBeInstanceOf(Event));
		const fn3 = jest.fn((e) => expect(e).toBeInstanceOf(Event));

		bus.on(Event, fn1);
		bus.on(Event, fn2);
		bus.on(Event, fn3);

		bus.publish(event);

		setTimeout(() => {
			expect(fn1.mock.calls.length).toBe(1);
			expect(fn2.mock.calls.length).toBe(1);
			expect(fn3.mock.calls.length).toBe(1);
			done();
		}, 0);
	});

	it("should send and receive messages to the correct destination (inherited classes)", (done) => {
		var event = new Event();
		class Event2 extends Event {};
		var event2 = new Event2;

		bus.on(Event2, (e) => {
			expect(e).toBeInstanceOf(Event2);
			done();
		});

		bus.publish(event);
		bus.publish(event2);
	});

	it("should send and receive messages to the correct destination (independen classes)", (done) => {
		var event = new Event();
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
		var event = new Event();
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
			bus.addEndMiddleware(CustomMiddleware(2, Operation.Add));

			bus.on(CustomEventNumber, (event) => {
				expect(event.data).toBe(3);
				done();
			})

			bus.publish(event);
		});
		
		it('Middlewares should be executed in the correct order', (done) => {
			const bus = new Bus<CustomEventNumber>();
			const event = new CustomEventNumber(2);

			bus.addEndMiddleware(CustomMiddleware(2, Operation.Divide));
			bus.addStartMiddleware(CustomMiddleware(2, Operation.Substract));
			bus.addStartMiddleware(CustomMiddleware(5, Operation.Multiply));
			bus.addEndMiddleware(CustomMiddleware(1, Operation.Substract));
			bus.addStartMiddleware(CustomMiddleware(3, Operation.Add));

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

			bus.addEndMiddleware(CustomMiddleware(2, Operation.Divide));
			bus.addStartMiddleware(CustomMiddleware(5, Operation.Multiply));
			//Void makes the middleware to return nothign.
			bus.addEndMiddleware(CustomMiddleware(1, Operation.Void));
			bus.addEndMiddleware(CustomMiddleware(1, Operation.Substract));
			bus.addStartMiddleware(CustomMiddleware(3, Operation.Add));

			const fn = jest.fn();

			bus.on(CustomEventNumber, fn);

			bus.publish(event);

			setTimeout(() => {
				expect(fn.mock.calls.length).toBe(0);
				done();
			}, 5);
		})
	});

});

class CustomEventNumber {
	data: number;
	constructor(data: number = 0) {
		this.data = data;
	}
}

enum Operation {
	Add,
	Multiply,
	Divide,
	Substract,
	Void
};

const CustomMiddleware: (number: number, operation: Operation) => IMiddleware<CustomEventNumber> = (number, operation) => (event) => {
	switch (operation) {
		case Operation.Add:
			return Promise.resolve(new CustomEventNumber(event.data + number));
		case Operation.Multiply:
			return Promise.resolve(new CustomEventNumber(event.data * number));
		case Operation.Divide:
			return Promise.resolve(new CustomEventNumber(event.data / number));
		case Operation.Substract:
			return Promise.resolve(new CustomEventNumber(event.data - number));
		case Operation.Void:
			return Promise.resolve();
		default:
			return Promise.resolve(new CustomEventNumber(event.data));
	}
}
