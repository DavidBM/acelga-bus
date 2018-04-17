export type MiddlewareResult<T = {}> = Promise<{item: T | void, finish: boolean}>;

export class MiddlewareChain<T = {}> {
	middlewares: Function[] = [];

	getAll(): Function[] {
		return Array.from(this.middlewares);
	}

	push(middleware: Function) {
		this.middlewares.push(middleware);
	}

	unshift(middleware: Function) {
		this.middlewares.unshift(middleware);
	}

	async execute(item: T): MiddlewareResult<T> {
		let resultingEvent: T = item;
		let finish = true;

		for (let middleware of this.middlewares) {
			resultingEvent = await middleware(resultingEvent);
			if(typeof resultingEvent === "undefined") {
				finish = false;
				break;
			};
		}

		return Promise.resolve({item: resultingEvent, finish});
	}
};
