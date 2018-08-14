import {Dispatcher} from '@src/corebus/dispatcher';

describe("Receiver", () => {
	let dispatcher: Dispatcher;

	beforeEach(() => {
		dispatcher = new Dispatcher();
	});

	it("should allow to register to events", (done) => {
		dispatcher.on(CustomEvent, (event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			done();
			return Promise.resolve();
		});

		dispatcher.trigger(new CustomEvent());
	});

	it("should allow to register multiple times to events", (done) => {
		var handler1 = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});
		var handler2 = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});

		dispatcher.on(CustomEvent, handler1);
		dispatcher.on(CustomEvent, handler2);

		dispatcher.trigger(new CustomEvent());

		setTimeout(() => {
			expect(handler1.mock.calls.length).toBe(1);
			expect(handler2.mock.calls.length).toBe(1);
			done();
		}, 5)
	});

	it("should call the handler one time per event", (done) => {
		var handler1 = jest.fn((event) => {
			return Promise.resolve();
		});
			
		dispatcher.on(CustomEvent, handler1);
		dispatcher.on(OtherEvent, handler1);

		dispatcher.trigger(new CustomEvent());
		dispatcher.trigger(new OtherEvent());

		setTimeout(() => {
			expect(handler1.mock.calls.length).toBe(2);
			done();
		}, 5)
	})

	it("should execute the handler only one time per event, doesn't matter how may subscriptions is done", (done) => {
		var handler1 = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});
			
		dispatcher.on(CustomEvent, handler1);
		dispatcher.on(CustomEvent, handler1);

		dispatcher.trigger(new CustomEvent());

		setTimeout(() => {
			expect(handler1.mock.calls.length).toBe(1);
			done();
		}, 5)
	});

	it("should send the correct envent", (done) => {
		dispatcher.on(CustomEvent, (event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			done();
			return Promise.resolve();
		});
		dispatcher.on(OtherEvent, (event) => {
			if(event instanceof CustomEvent)
				done.fail(new Error('wrong callbacl called'));
			return Promise.resolve();
		});

		dispatcher.trigger(new OtherEvent());
		dispatcher.trigger(new CustomEvent());
	});

	it("should send all envents to global subscriptions", (done) => {
		dispatcher.onAny((event) => {
			expect(event).toBeInstanceOf(OtherEvent);
			done();
			return Promise.resolve();
		});

		dispatcher.trigger(new OtherEvent());
	});

	it("should send all envents to global subscriptions", (done) => {
		dispatcher.onAny((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			done();
			return Promise.resolve();
		});

		dispatcher.trigger(new CustomEvent());
	});

	it("should be able to clone itself and the clone should have the same subscriptions", (done) => {
		dispatcher.on(CustomEvent, (event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			done();
			return Promise.resolve();
		});
		dispatcher.on(OtherEvent, (event) => {
			if(event instanceof CustomEvent)
				done.fail(new Error('wrong callbacl called'));
			return Promise.resolve();
		});

		dispatcher.trigger(new OtherEvent());
		dispatcher.trigger(new CustomEvent());
	});

	it("should allow to deregister a callback", (done) => {
		var handler = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});

		dispatcher.on(CustomEvent, handler);
		dispatcher.off(CustomEvent, handler);

		dispatcher.trigger(new CustomEvent());

		setTimeout(() => {
			expect(handler.mock.calls.length).toBe(0);
			done();
		}, 5);
	});

	it("should allow to deregister all callbackks from an event", (done) => {
		var handler = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});

		dispatcher.on(CustomEvent, handler);
		dispatcher.off(CustomEvent);

		dispatcher.trigger(new CustomEvent());

		setTimeout(() => {
			expect(handler.mock.calls.length).toBe(0);
			done();
		}, 5);
	});

	it("should execute middlewares", (done) => {
		let dispatcher = new Dispatcher<NumberEvent>();

		var handler = jest.fn((event) => {
			expect(event).toEqual(new NumberEvent(-5.5));
			done();
			return Promise.resolve();
		});

		dispatcher.on(NumberEvent, handler);

		dispatcher.pushMiddleware(event => Promise.resolve(new NumberEvent(event.n * 3)));
		dispatcher.unshiftMiddleware(event => new NumberEvent(event.n / 2));
		dispatcher.pushMiddleware(event => Promise.resolve(new NumberEvent(event.n - 10)));

		dispatcher.trigger(new NumberEvent(3));
	})

	it("should not execute the handler if a middleware returns void", (done) => {
		failTestIfMiddlewareDelivered(dispatcher, undefined, done);
	});

	it("should not execute the handler if a middleware returns 0", (done) => {
		failTestIfMiddlewareDelivered(dispatcher, 0, done);
	});

	it("should not execute the handler if a middleware returns \"\"", (done) => {
		failTestIfMiddlewareDelivered(dispatcher, "", done);
	});

	it("should not execute the handler if a middleware returns NaN", (done) => {
		failTestIfMiddlewareDelivered(dispatcher, NaN, done);
	});

	it("should allow to deregister from a non existent event without throw", () => {
		expect(() => dispatcher.off(CustomEvent)).not.toThrow();
		expect(() => dispatcher.off(CustomEvent, () => {})).not.toThrow();

		expect(() => dispatcher.trigger(new CustomEvent())).not.toThrow();
	});
});

class NumberEvent{
	n: number;
	constructor(n: number) { this.n = n; }
}
class CustomEvent{};
class OtherEvent{};

function failTestIfMiddlewareDelivered(dispatcher: Dispatcher, item: any, done: jest.DoneCallback) {
	var handler = jest.fn((event) => {
		done.fail();
		return Promise.resolve();
	});

	dispatcher.on(CustomEvent, handler);

	dispatcher.pushMiddleware(event => Promise.resolve(item));

	dispatcher.trigger(new CustomEvent());

	setTimeout(() => {
		expect(handler.mock.calls.length).toBe(0);
		done();
	}, 5);
}