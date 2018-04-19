import {IMiddleware, IPostMiddleware, IEvent} from './interfaces';

export type MiddlewareResult<T = {}> = Promise<{item: T | void, finish: boolean}>;


export class MiddlewareChain<MID extends IMiddleware<T> | IPostMiddleware<T>, T = IEvent> {
	middlewares: MID[] = [];

	getAll(): MID[] {
		return Array.from(this.middlewares);
	}

	push(middleware: MID) {
		this.middlewares.push(middleware);
	}

	unshift(middleware: MID) {
		this.middlewares.unshift(middleware);
	}

	async execute(item: T): MiddlewareResult<T> {
		let resultingEvent: T | void = item;
		let finish = true;

		for (let middleware of this.middlewares) {
			if(typeof resultingEvent === "undefined") {
				finish = false;
				break;
			}
			resultingEvent = await middleware(resultingEvent);
		}

		return Promise.resolve({item: resultingEvent, finish});
	}
};
