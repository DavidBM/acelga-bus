import {Dispatcher} from '../../../corebus/dispatchers/single';

class CustomEvent{}
class OtherEvent{}

describe('Receiver', () => {
	let dispatcher: Dispatcher;

	beforeEach(() => {
		dispatcher = new Dispatcher();
	});

	it('should allow to register to events', (done) => {
		dispatcher.on(CustomEvent, (event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			done();
			return Promise.resolve();
		});

		dispatcher.trigger(new CustomEvent());
	});

	it('should allow to register multiple times to events', (done) => {
		const handler1 = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});
		const handler2 = jest.fn((event) => {
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
		}, 5);
	});

	it('should call the handler one time per event', (done) => {
		const handler1 = jest.fn((event) => {
			return Promise.resolve();
		});

		dispatcher.on(CustomEvent, handler1);
		dispatcher.on(OtherEvent, handler1);

		dispatcher.trigger(new CustomEvent());
		dispatcher.trigger(new OtherEvent());

		setTimeout(() => {
			expect(handler1.mock.calls.length).toBe(2);
			done();
		}, 5);
	});

	it('should recognize when a event is already subscribed', () => {
		const handler1 = jest.fn((event) => {
			return Promise.resolve();
		});

		dispatcher.on(CustomEvent, handler1);

		expect(dispatcher.isListened(CustomEvent)).toBe(true);
		expect(dispatcher.isListened(OtherEvent)).toBe(false);
	});

	it('should not call the callback if there is a falsable variable in the trigger method', (done) => {
		const handler1 = jest.fn((event) => {
			return Promise.resolve();
		});

		dispatcher.on(CustomEvent, handler1);

		dispatcher.trigger(null as any);
		dispatcher.trigger(NaN as any);
		dispatcher.trigger(undefined as any);
		dispatcher.trigger(0 as any);

		setTimeout(() => {
			expect(handler1.mock.calls.length).toBe(0);
			done();
		}, 15);
	});

	it('should not call', (done) => {
		const handler1 = jest.fn((event) => {
			return Promise.resolve();
		});

		dispatcher.on(CustomEvent, handler1);

		dispatcher.trigger(null as any);

		setTimeout(() => {
			expect(handler1.mock.calls.length).toBe(0);
			done();
		}, 15);
	});

	it('should execute the handler only one time per event, doesn\'t matter how may subscriptions is done', (done) => {
		const handler1 = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});

		dispatcher.on(CustomEvent, handler1);
		dispatcher.on(CustomEvent, handler1);

		dispatcher.trigger(new CustomEvent());

		setTimeout(() => {
			expect(handler1.mock.calls.length).toBe(1);
			done();
		}, 5);
	});

	it('should send the correct envent', (done) => {
		dispatcher.on(CustomEvent, (event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			done();
			return Promise.resolve();
		});
		dispatcher.on(OtherEvent, (event) => {
			if (event instanceof CustomEvent)
				done.fail(new Error('wrong callbacl called'));
			return Promise.resolve();
		});

		dispatcher.trigger(new OtherEvent());
		dispatcher.trigger(new CustomEvent());
	});

	it('should send all envents to global subscriptions', (done) => {
		dispatcher.onAny((event) => {
			expect(event).toBeInstanceOf(OtherEvent);
			done();
			return Promise.resolve();
		});

		dispatcher.trigger(new OtherEvent());
	});

	it('should send all envents to global subscriptions', (done) => {
		dispatcher.onAny((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			done();
			return Promise.resolve();
		});

		dispatcher.trigger(new CustomEvent());
	});

	it('should be able to clone itself and the clone should have the same subscriptions', (done) => {
		dispatcher.on(CustomEvent, (event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			done();
			return Promise.resolve();
		});
		dispatcher.on(OtherEvent, (event) => {
			if (event instanceof CustomEvent)
				done.fail(new Error('wrong callbacl called'));
			return Promise.resolve();
		});

		dispatcher.trigger(new OtherEvent());
		dispatcher.trigger(new CustomEvent());
	});

	it('should allow to deregister a callback', (done) => {
		const handler = jest.fn((event) => {
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

	it('should allow to deregister all callbacks from an event', (done) => {
		const handler = jest.fn((event) => {
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

	it('should allow deregister any callbackks if the callback is not found', (done) => {
		const handler = jest.fn((event) => {
			expect(event).toBeInstanceOf(CustomEvent);
			return Promise.resolve();
		});

		dispatcher.on(CustomEvent, handler);
		dispatcher.off(OtherEvent, handler);

		dispatcher.trigger(new CustomEvent());

		setTimeout(() => {
			expect(handler.mock.calls.length).toBe(1);
			done();
		}, 15);
	});
});
