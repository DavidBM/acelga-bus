import {MiddlewareChain} from './middlewareChain';

export class Publisher<T = {}> {
	middlewareChain: MiddlewareChain<T> = new MiddlewareChain<T>();
	listeners: Set<Function> = new Set();
	handler: (item: T, original: T) => Promise<void>;

	constructor(handler: (item: T, original: T) => Promise<void>) {
		this.handler = handler;
	}

	async publish(item: T): Promise<void> {
		const result = await this.middlewareChain.execute(item);

		if(!result || !result.finish || !result.item) return Promise.resolve();

		return this.handler(result.item, item);	
	}

	pushMiddleware(middleware: Function) {
		this.middlewareChain.push(middleware);
	}

	unshiftMiddleware(middleware: Function) {
		this.middlewareChain.unshift(middleware);
	}
}