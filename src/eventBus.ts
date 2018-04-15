import {
	Constructable,
	IEvent, 
	EventSubscriptionCallback, 
	IEventBus,
	IMiddleware,
	EventCallbacksSet
} from './interfaces';

import {Executor} from './executor';

export class EventBus<T = IEvent> implements IEventBus<T> {
	subscriptions: WeakMap<Constructable<T>, EventCallbacksSet<T>> = new WeakMap();
	middlewares: IMiddleware<T>[] = [];

	async publish(event: T): Promise<any> {
		let callbacks = this.subscriptions.get(event.constructor as Constructable<T>);

		if(!callbacks) return Promise.resolve();

		const resultingEvent = await this.executeMiddlewares(event);

		if(!resultingEvent) return Promise.resolve();

		const executor = new Executor<T>(resultingEvent, ...callbacks);

		return executor.execStopOnFail();
	}

	on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void {
		var callbacksSet = this.subscriptions.get(eventType as Constructable<T>);

		if(!callbacksSet) callbacksSet = new Set();


		callbacksSet.add(callback as EventSubscriptionCallback<T>);

		this.subscriptions.set(eventType as Constructable<T>, callbacksSet);
	}

	addStartMiddleware(middleware: IMiddleware<T>): void{
		this.middlewares.unshift(middleware);
	}

	addEndMiddleware(middleware: IMiddleware<T>){
		this.middlewares.push(middleware);
	}

	async executeMiddlewares(event: T): Promise<T | void> {
		let resultingEvent: T | void = event;

		for (let middleware of this.middlewares) {
			resultingEvent = await middleware(resultingEvent);
			if(!resultingEvent) break;
		}

		return Promise.resolve(resultingEvent);
	}
}
