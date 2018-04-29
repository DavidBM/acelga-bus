import {IMiddleware} from './interfaces';

export class MiddlewareChain<MID extends IMiddleware<T>, T> {
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

	remove(middleware: MID) {
		this.middlewares = this.middlewares.filter(mid => mid !== middleware);
	}

	async execute(item: T): Promise<T|void> {
		let resultingEvent: T | void = item;

		for (let middleware of this.middlewares) {
			if(!resultingEvent) break;
			resultingEvent = await middleware(resultingEvent);
		}

		return Promise.resolve(resultingEvent);
	}
};
