import {MiddlewareChain} from './middlewareChain';
import {IMiddleware} from './interfaces';

export class Publisher<T = {}> {
	middlewareChain: MiddlewareChain<IMiddleware<T>, T> = new MiddlewareChain();
	listeners: Set<Function> = new Set();
	handler: (item: T, original: T) => Promise<void>;

	constructor(handler: (item: T, original: T) => Promise<void>) {
		this.handler = handler;
	}

	public async publish(item: T): Promise<void> {
		const result = await this.middlewareChain.execute(item);

		if(!result) return Promise.resolve();

		return this.handler(result, item);	
	}

	cleanMiddlewares() {
		this.middlewareChain = new MiddlewareChain();
	}

	clone() {
		var publisher = new Publisher(this.handler);

		for (let middleware of this.middlewareChain.getAll()){
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
}