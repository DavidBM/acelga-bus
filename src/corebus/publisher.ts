import {MiddlewareChain} from './middlewareChain';
import {IMiddleware, EventSubscriptionCallback} from './interfaces';

export class Publisher<T = {}> {
	middlewareChain: MiddlewareChain<IMiddleware<T>, T> = new MiddlewareChain();
	listeners: Set<EventSubscriptionCallback> = new Set();
	handler: (item: T, original: T) => Promise<void>;

	constructor(handler: (item: T, original: T) => Promise<void>) {
		this.handler = handler;
	}

	public async publish(item: T): Promise<void> {
		const result = await this.middlewareChain.execute(item);

		if (!result) return;

		return this.handler(result, item);
	}

	cleanMiddlewares() {
		this.middlewareChain = new MiddlewareChain();
	}

	clone() {
		const publisher = new Publisher(this.handler);

		for (const middleware of this.middlewareChain.getAll()){
			publisher.pushMiddleware(middleware);
		}

		return publisher;
	}

	pushMiddleware(middleware: IMiddleware<T>) {
		this.middlewareChain.push(middleware);
	}

	unshiftMiddleware(middleware: IMiddleware<T>) {
		this.middlewareChain.unshift(middleware);
	}

	pushMiddlewareAndKeepLast(middleware: IMiddleware<T>, force?: boolean) {
		this.middlewareChain.pushAndKeepLast(middleware, force);
	}

	unshiftMiddlewareAndKeepFirst(middleware: IMiddleware<T>, force?: boolean) {
		this.middlewareChain.unshiftAndKeepFirst(middleware, force);
	}
}
