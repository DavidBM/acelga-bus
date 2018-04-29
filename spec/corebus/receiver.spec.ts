import {Receiver} from '@src/corebus/receiver';

describe("Receiver", () => {
	let receiver: Receiver;

	beforeEach(() => {
		receiver = new Receiver();
	});

	it("should allow to register to events", (done) => {
		receiver.on(CustomEvent, (event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			done();
			return Promise.resolve();
		});

		receiver.trigger(new CustomEvent());
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

		receiver.on(CustomEvent, handler1);
		receiver.on(CustomEvent, handler2);

		receiver.trigger(new CustomEvent());

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
			
		receiver.on(CustomEvent, handler1);
		receiver.on(OtherEvent, handler1);

		receiver.trigger(new CustomEvent());
		receiver.trigger(new OtherEvent());

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
			
		receiver.on(CustomEvent, handler1);
		receiver.on(CustomEvent, handler1);

		receiver.trigger(new CustomEvent());

		setTimeout(() => {
			expect(handler1.mock.calls.length).toBe(1);
			done();
		}, 5)
	});

	it("should send the correct envent", (done) => {
		receiver.on(CustomEvent, (event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			done();
			return Promise.resolve();
		});
		receiver.on(OtherEvent, (event) => {
			if(event instanceof CustomEvent)
				done.fail(new Error('wrong callbacl called'));
			return Promise.resolve();
		});

		receiver.trigger(new OtherEvent());
		receiver.trigger(new CustomEvent());
	});

	it("should be able to clone itself and the clone should have the same subscriptions", (done) => {
		receiver.on(CustomEvent, (event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			done();
			return Promise.resolve();
		});
		receiver.on(OtherEvent, (event) => {
			if(event instanceof CustomEvent)
				done.fail(new Error('wrong callbacl called'));
			return Promise.resolve();
		});

		receiver.trigger(new OtherEvent());
		receiver.trigger(new CustomEvent());
	});

	it("should allow to deregister a callback", (done) => {
		var handler = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});

		receiver.on(CustomEvent, handler);
		receiver.off(CustomEvent, handler);

		receiver.trigger(new CustomEvent());

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

		receiver.on(CustomEvent, handler);
		receiver.off(CustomEvent);

		receiver.trigger(new CustomEvent());

		setTimeout(() => {
			expect(handler.mock.calls.length).toBe(0);
			done();
		}, 5);
	});

	it("should execute middlewares", (done) => {
		let receiver = new Receiver<NumberEvent>();

		var handler = jest.fn((event) => {
			expect(event).toEqual(new NumberEvent(-5.5));
			done();
			return Promise.resolve();
		});

		receiver.on(NumberEvent, handler);

		receiver.pushMiddleware(event => Promise.resolve(new NumberEvent(event.n * 3)));
		receiver.unshiftMiddleware(event => new NumberEvent(event.n / 2));
		receiver.pushMiddleware(event => Promise.resolve(new NumberEvent(event.n - 10)));

		receiver.trigger(new NumberEvent(3));
	})

	it("should not execute the handler if a middleware returns void", (done) => {
		failTestIfMiddlewareDelivered(receiver, undefined, done);
	});

	it("should not execute the handler if a middleware returns 0", (done) => {
		failTestIfMiddlewareDelivered(receiver, 0, done);
	});

	it("should not execute the handler if a middleware returns \"\"", (done) => {
		failTestIfMiddlewareDelivered(receiver, "", done);
	});

	it("should not execute the handler if a middleware returns NaN", (done) => {
		failTestIfMiddlewareDelivered(receiver, NaN, done);
	});

	it("should allow to deregister from a non existent event without throw", () => {
		expect(() => receiver.off(CustomEvent)).not.toThrow();
		expect(() => receiver.off(CustomEvent, () => {})).not.toThrow();

		expect(() => receiver.trigger(new CustomEvent())).not.toThrow();
	});
});

class NumberEvent{
	n: number;
	constructor(n: number) { this.n = n; }
}
class CustomEvent{};
class OtherEvent{};

function failTestIfMiddlewareDelivered(receiver: Receiver, item: any, done: jest.DoneCallback) {
	var handler = jest.fn((event) => {
		done.fail();
		return Promise.resolve();
	});

	receiver.on(CustomEvent, handler);

	receiver.pushMiddleware(event => Promise.resolve(item));

	receiver.trigger(new CustomEvent());

	setTimeout(() => {
		expect(handler.mock.calls.length).toBe(0);
		done();
	}, 5);
}