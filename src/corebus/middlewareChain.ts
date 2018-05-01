import {IMiddleware} from './interfaces';

export class MiddlewareChain<MID extends IMiddleware<T>, T> {
	middlewares: MID[] = [];
	keepLast: MID | null = null;
	keepFirst: MID | null = null;

	getAll(): MID[] {
		return Array.from(this.middlewares);
	}

	push(middleware: MID) {
		if (!this.keepLast) return this.middlewares.push(middleware);

		const lastMiddleware = this.middlewares.pop();
		this.middlewares.push(middleware);

		if (lastMiddleware)
			this.middlewares.push(lastMiddleware);
	}

	pushAndKeepLast(middleware: MID, overwriteLast?: boolean): boolean {
		if (this.keepLast && !overwriteLast){
			return false;
		}

		this.keepLast = middleware;
		this.push(middleware);
		return true;
	}

	unshift(middleware: MID) {
		if (!this.keepFirst) return this.middlewares.unshift(middleware);

		const firstMiddleware = this.middlewares.shift();
		this.middlewares.unshift(middleware);

		if (firstMiddleware)
			this.middlewares.unshift(firstMiddleware);
	}

	unshiftAndKeepFirst(middleware: MID, overwriteFirst?: boolean): boolean {
		if (this.keepFirst && !overwriteFirst){
			return false;
		}

		this.keepFirst = middleware;
		this.unshift(middleware);
		return true;
	}

	remove(middleware: MID) {
		this.middlewares = this.middlewares.filter(mid => mid !== middleware);

		if (this.keepLast === middleware){
			this.keepLast = null;
		}

		if (this.keepFirst === middleware){
			this.keepFirst = null;
		}

		if (this.middlewares.length === 0){
			this.keepFirst = null;
			this.keepLast = null;
		}
	}

	async execute(item: T): Promise<T|void> {
		let resultingEvent: T | void = item;

		for (const middleware of this.middlewares) {
			if (!resultingEvent) break;
			resultingEvent = await middleware(resultingEvent);
		}

		return resultingEvent;
	}
}
