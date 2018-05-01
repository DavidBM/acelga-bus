import {IMiddleware} from './interfaces';

export class MiddlewareChain<MID extends IMiddleware<T>, T> {
	middlewares: MID[] = [];
	alwaysLast: MID | null = null;
	alwaysFirst: MID | null = null;

	getAll(): MID[] {
		return Array.from(this.middlewares);
	}

	push(middleware: MID) {
		if (!this.alwaysLast) return this.middlewares.push(middleware);

		const lastMiddleware = this.middlewares.pop();
		this.middlewares.push(middleware);

		if (lastMiddleware)
			this.middlewares.push(lastMiddleware);
	}

	pushAndKeepLast(middleware: MID, overwriteLast?: boolean): boolean {
		if (this.alwaysLast && !overwriteLast){
			return false;
		}

		this.alwaysLast = middleware;
		this.push(middleware);
		return true;
	}

	unshift(middleware: MID) {
		if (!this.alwaysFirst) return this.middlewares.unshift(middleware);

		const firstMiddleware = this.middlewares.shift();
		this.middlewares.unshift(middleware);

		if (firstMiddleware)
			this.middlewares.unshift(firstMiddleware);
	}

	unshiftAndKeepFirst(middleware: MID, overwriteFirst?: boolean): boolean {
		if (this.alwaysFirst && !overwriteFirst){
			return false;
		}

		this.alwaysFirst = middleware;
		this.unshift(middleware);
		return true;
	}

	remove(middleware: MID) {
		this.middlewares = this.middlewares.filter(mid => mid !== middleware);

		if (this.alwaysLast === middleware){
			this.alwaysLast = null;
		}

		if (this.alwaysFirst === middleware){
			this.alwaysFirst = null;
		}

		if (this.middlewares.length === 0){
			this.alwaysFirst = null;
			this.alwaysLast = null;
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
