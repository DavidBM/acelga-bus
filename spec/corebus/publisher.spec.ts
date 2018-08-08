import {Publisher} from '@src/corebus/publisher';


describe("Publisher", () => {
	let pub: Publisher;
	let handler = <T>(item: T) => Promise.resolve();

	beforeEach(() => {
		pub = new Publisher(handler);
	});

	it("it launch an event with the message to publish", (done) => {
		pub = new Publisher((event: any) => {
			expect(event).toBe(34);
			done();
			return Promise.resolve();
		});

		pub.publish(34);
	});

	it("executes the middleware chaining and launch the event for publishing", (done) => {
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

	it("should not execute the handler if a middleware returns void", (done) => {
		testAvoidHandlerCall(undefined, done);
	});

	it("should not execute the handler if a middleware returns \"\"", (done) => {
		testAvoidHandlerCall("", done);
	});

	it("should not execute the handler if a middleware returns 0", (done) => {
		testAvoidHandlerCall(0, done);
	});

	it("should not execute the handler if a middleware returns NaN", (done) => {
		testAvoidHandlerCall(NaN, done);
	});

	it("it does not launch is the middleware chain don't finish", (done) => {
		const handler = jest.fn((event: any) => Promise.resolve());

		const pubNumber = new Publisher<number>(handler);

		pubNumber.pushMiddleware((item: number) => Promise.resolve(item / 3));
		pubNumber.unshiftMiddleware((item: number) => item - 2);
		pubNumber.unshiftMiddleware((item: number) => Promise.resolve(undefined));
		pubNumber.pushMiddleware((item: number) => Promise.resolve(item + 1));

		pubNumber.publish(34);

		setTimeout(() => {
			expect(handler.mock.calls.length).toBe(0);
			done();
		})
	});

	it("should be cloned with the same handler and chain", (done) => {
		const handler = jest.fn((event: any) => Promise.resolve());

		const pub1 = new Publisher<number>(handler);
		pub1.pushMiddleware((item: number) => Promise.resolve(item / 3));

		const pub2 = pub1.clone();

		pub2.pushMiddleware((item: number) => Promise.resolve(item + 1));

		pub1.publish(9);
		pub2.publish(81);

		setTimeout(() => {
			expect(handler.mock.calls.length).toBe(2);
			expect(handler.mock.calls.filter(a => a[0] === 3).length).toBe(1);
			expect(handler.mock.calls.filter(a => a[0] === 28).length).toBe(1);
			done();
		})
	});

	it("should be cloned with the same handler and chain", (done) => {
		const handler = jest.fn((event: any) => Promise.resolve());

		const pub = new Publisher<number>(handler);
		pub.pushMiddleware((item: number) => Promise.resolve(item / 3));
		pub.publish(9);

		pub.cleanMiddlewares();

		pub.publish(9);

		setTimeout(() => {
			expect(handler.mock.calls.length).toBe(2);
			expect(handler.mock.calls.filter(a => a[0] === 3).length).toBe(1);
			expect(handler.mock.calls.filter(a => a[0] === 9).length).toBe(1);
			done();
		})
	});

	it("should keep firstAndKeep & lastAndKeep middlewares if provided", (done) => {
		const handler = (event: any) => {
			expect(event).toBe(4);
			done();
			return Promise.resolve();
		};

		const pub = new Publisher<number>(handler);
		pub.pushMiddlewareAndKeepLast((item: number) => Promise.resolve(item / 3));
		pub.pushMiddleware((item: number) => Promise.resolve(item + 2));
		pub.publish(10);
	});

	it("should keep firstAndKeep & lastAndKeep middlewares if provided", (done) => {
		const handler = (event: any) => {
			expect(event).toBe(5);
			done();
			return Promise.resolve();
		};

		const pub = new Publisher<number>(handler);
		pub.unshiftMiddlewareAndKeepFirst((item: number) => Promise.resolve(item / 3));
		pub.unshiftMiddleware((item: number) => Promise.resolve(item + 2));
		pub.publish(9);
	});
});

function testAvoidHandlerCall(value: any, done: jest.DoneCallback) {
	const handler = jest.fn((event: any) => {
		done.fail();
		return Promise.resolve();
	});

	const publisher = new Publisher(handler);

	publisher.pushMiddleware((item: number) => Promise.resolve());

	publisher.publish(value);

	setTimeout(() => {
		expect(handler.mock.calls.length).toBe(0);
		done();
	}, 5);
}