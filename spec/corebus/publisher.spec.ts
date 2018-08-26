import {Publisher} from '@src/corebus/publisher';

describe('Publisher', () => {
	let pub: Publisher;
	const handler = <T>(item: T) => Promise.resolve();

	beforeEach(() => {
		pub = new Publisher(handler);
	});

	it('it launch an event with the message to publish', (done) => {
		pub = new Publisher((event: any) => {
			expect(event).toBe(34);
			done();
			return Promise.resolve();
		});

		pub.publish(34);
	});

	it('executes the middleware chaining and launch the event for publishing', (done) => {
		const pubNumber = new Publisher<number>((event: any) => {
			expect(event).toBe(6);
			done();
			return Promise.resolve();
		});

		pubNumber.pushMiddleware((item: number) => Promise.resolve(item / 3));
		pubNumber.unshiftMiddleware((item: number) => Promise.resolve(item - 2));
		pubNumber.unshiftMiddleware((item: number) => Promise.resolve(item / 2));
		pubNumber.pushMiddleware((item: number) => Promise.resolve(item + 1));

		pubNumber.publish(34);
	});

	it('should not execute the handler if a middleware returns void', (done) => {
		testAvoidHandlerCall(undefined, done);
	});

	it('should not execute the handler if a middleware returns \'\'', (done) => {
		testAvoidHandlerCall('', done);
	});

	it('should not execute the handler if a middleware returns 0', (done) => {
		testAvoidHandlerCall(0, done);
	});

	it('should not execute the handler if a middleware returns NaN', (done) => {
		testAvoidHandlerCall(NaN, done);
	});

	it('it does not launch is the middleware chain don\'t finish', (done) => {
		const spyHandler = jest.fn((event: any) => Promise.resolve());

		const pubNumber = new Publisher<number>(spyHandler);

		pubNumber.pushMiddleware((item: number) => Promise.resolve(item / 3));
		pubNumber.unshiftMiddleware((item: number) => item - 2);
		pubNumber.unshiftMiddleware((item: number) => Promise.resolve(undefined));
		pubNumber.pushMiddleware((item: number) => Promise.resolve(item + 1));

		pubNumber.publish(34);

		setTimeout(() => {
			expect(spyHandler.mock.calls.length).toBe(0);
			done();
		}, 0);
	});

	it('should be cloned with the same handler and chain', (done) => {
		const spyHandler = jest.fn((event: any) => Promise.resolve());

		const pub1 = new Publisher<number>(spyHandler);
		pub1.pushMiddleware((item: number) => Promise.resolve(item / 3));

		const pub2 = pub1.clone();

		pub2.pushMiddleware((item: number) => Promise.resolve(item + 1));

		pub1.publish(9);
		pub2.publish(81);

		setTimeout(() => {
			expect(spyHandler.mock.calls.length).toBe(2);
			expect(spyHandler.mock.calls.filter(a => a[0] === 3).length).toBe(1);
			expect(spyHandler.mock.calls.filter(a => a[0] === 28).length).toBe(1);
			done();
		}, 0);
	});

	it('should be cloned with the same handler and chain', (done) => {
		const spyHandler = jest.fn((event: any) => Promise.resolve());

		const publisher = new Publisher<number>(spyHandler);
		publisher.pushMiddleware((item: number) => Promise.resolve(item / 3));
		publisher.publish(9);

		publisher.cleanMiddlewares();

		publisher.publish(9);

		setTimeout(() => {
			expect(spyHandler.mock.calls.length).toBe(2);
			expect(spyHandler.mock.calls.filter(a => a[0] === 3).length).toBe(1);
			expect(spyHandler.mock.calls.filter(a => a[0] === 9).length).toBe(1);
			done();
		}, 0);
	});

	it('should keep firstAndKeep & lastAndKeep middlewares if provided', (done) => {
		const spyHandler = (event: any) => {
			expect(event).toBe(4);
			done();
			return Promise.resolve();
		};

		const publisher = new Publisher<number>(spyHandler);
		publisher.pushMiddlewareAndKeepLast((item: number) => Promise.resolve(item / 3));
		publisher.pushMiddleware((item: number) => Promise.resolve(item + 2));
		publisher.publish(10);
	});

	it('should keep firstAndKeep & lastAndKeep middlewares if provided', (done) => {
		const spyHandler = (event: any) => {
			expect(event).toBe(5);
			done();
			return Promise.resolve();
		};

		const publisher = new Publisher<number>(spyHandler);
		publisher.unshiftMiddlewareAndKeepFirst((item: number) => Promise.resolve(item / 3));
		publisher.unshiftMiddleware((item: number) => Promise.resolve(item + 2));
		publisher.publish(9);
	});
});

function testAvoidHandlerCall(value: any, done: jest.DoneCallback) {
	const spyHandler = jest.fn((event: any) => {
		done.fail();
		return Promise.resolve();
	});

	const publisher = new Publisher(spyHandler);

	publisher.pushMiddleware((item: number) => Promise.resolve());

	publisher.publish(value);

	setTimeout(() => {
		expect(spyHandler.mock.calls.length).toBe(0);
		done();
	}, 5);
}
