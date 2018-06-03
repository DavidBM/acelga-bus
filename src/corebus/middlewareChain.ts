import {IMiddleware} from './interfaces';

export class MiddlewareChain<MID extends IMiddleware<T>, T> {
	middlewares: MID[] = [];
	alwaysLast: Array<MID> = [];
	alwaysFirst: Array<MID> = [];

	getAll(): MID[] {
		return Array.from(this.middlewares);
	}

	push(middleware: MID) {
		const allMiddlewares = this.getCenterMiddlewares();
		allMiddlewares.push(middleware);
		this.rebuildMiddlewaresFromCenter(allMiddlewares);
	}

	pushAndKeepLast(middleware: MID, force?: boolean) {
		const allMiddlewares = this.getCenterMiddlewares();

		if (this.alwaysLast.length !== 0 && !force){
			this.alwaysLast.unshift(middleware);
			return this.rebuildMiddlewaresFromCenter(allMiddlewares);
		}

		this.alwaysLast.push(middleware);
		return this.rebuildMiddlewaresFromCenter(allMiddlewares);
	}

	unshift(middleware: MID) {
		const allMiddlewares = this.getCenterMiddlewares();
		allMiddlewares.unshift(middleware);
		this.rebuildMiddlewaresFromCenter(allMiddlewares);
	}

	unshiftAndKeepFirst(middleware: MID, force?: boolean) {
		const allMiddlewares = this.getCenterMiddlewares();

		if (this.alwaysFirst.length !== 0 && !force){
			this.alwaysFirst.push(middleware);
			return this.rebuildMiddlewaresFromCenter(allMiddlewares);
		}

		this.alwaysFirst.unshift(middleware);
		return this.rebuildMiddlewaresFromCenter(allMiddlewares);
	}

	remove(middleware: MID) {
		this.middlewares = this.middlewares.filter(mid => mid !== middleware);

		if (this.alwaysLast.includes(middleware)){
			this.alwaysLast = this.alwaysLast.filter(midd => midd !== middleware);
		}

		if (this.alwaysFirst.includes(middleware)){
			this.alwaysFirst = this.alwaysFirst.filter(midd => midd !== middleware);
		}
	}

	getCenterMiddlewares(): MID[] {
		return this.middlewares.slice(this.alwaysFirst.length, this.middlewares.length - this.alwaysLast.length);
	}

	rebuildMiddlewaresFromCenter(center: MID[]) {
		this.middlewares = [...this.alwaysFirst, ...center, ...this.alwaysLast];
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
