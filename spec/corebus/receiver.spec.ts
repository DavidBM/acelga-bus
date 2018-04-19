import {Receiver} from '@src/corebus/receiver';
import {IEvent} from '@src/index';

describe("Receiver", () => {
	let receiver: Receiver;

	beforeEach(() => {
		receiver = new Receiver<IEvent>();
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

	it("should a handler only one time per event, doesn't matter how may subscriptions is done", (done) => {
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

	it("should allow to deregister from a non existent event without throw", () => {
		expect(() => receiver.off(CustomEvent)).not.toThrow();
		expect(() => receiver.off(CustomEvent, () => {})).not.toThrow();

		expect(() => receiver.trigger(new CustomEvent())).not.toThrow();
	});
});

class CustomEvent implements IEvent{};
class OtherEvent implements IEvent{};
