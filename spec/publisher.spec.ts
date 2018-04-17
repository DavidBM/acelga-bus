import {Publisher} from '@src/publisher';

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

		pubNumber.pushMiddleware((item: number) => item / 3);
		pubNumber.unshiftMiddleware((item: number) => item - 2);
		pubNumber.unshiftMiddleware((item: number) => item / 2);
		pubNumber.pushMiddleware((item: number) => item + 1);

		pubNumber.publish(34);
	});

	it("it does not launch is the middleware chain don't finish", (done) => {
		const handler = jest.fn((event: any) => Promise.resolve());

		const pubNumber = new Publisher<number>(handler);

		pubNumber.pushMiddleware((item: number) => item / 3);
		pubNumber.unshiftMiddleware((item: number) => item - 2);
		pubNumber.unshiftMiddleware((item: number) => undefined);
		pubNumber.pushMiddleware((item: number) => item + 1);

		pubNumber.publish(34);

		setTimeout(() => {
			expect(handler.mock.calls.length).toBe(0);
			done();
		}, 5)
	});
});