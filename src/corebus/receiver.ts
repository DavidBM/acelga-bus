import {Executor} from './executor';
import {MiddlewareChain} from './middlewareChain';
import {
	IEvent,
	Constructable, 
	EventSubscriptionCallback, 
	EventCallbacksSet,
	IMiddleware,
	IPostMiddleware
} from './interfaces';

export class Receiver<T = IEvent> {

	middlewareChain: MiddlewareChain<IPostMiddleware<T>, T> = new MiddlewareChain();
	subscriptions: WeakMap<Constructable<T>, EventCallbacksSet<T>> = new WeakMap();

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void {
		var callbacksSet = this.subscriptions.get(eventType as Constructable<T>);

		if(!callbacksSet) callbacksSet = new Set();

		callbacksSet.add(callback as EventSubscriptionCallback<T>);

		this.subscriptions.set(eventType as Constructable<T>, callbacksSet);
	}

	public async trigger(event: T): Promise<void> {
		//We force the type, removing the void from the return of the middleware chain
		//because it "guarantees" that if it is a post middleware, it will return something.
		//TODO: fix types of middlewareChain.ts for avoiding this casting
		const result = await this.middlewareChain.execute(event) as {item: T};

		let callbacks = this.subscriptions.get(event.constructor as Constructable<T>);

		if(!callbacks) return Promise.resolve();

		const executor = new Executor<T>(result.item, ...callbacks);

		return executor.execStopOnFail();
	}

	public off<T1 extends T>(eventType: Constructable<T1>, callback?: EventSubscriptionCallback<T1> ): void {
		if(!callback){ 
			this.subscriptions.delete(eventType);
			return;
		}

		let callbacks = this.subscriptions.get(eventType as Constructable<T>);

		if(!callbacks) return;

		callbacks.delete(callback as EventSubscriptionCallback<T>);
	}

	pushMiddleware(middleware: IPostMiddleware<T>) {
		this.middlewareChain.push(middleware);
	}

	unshiftMiddleware(middleware: IPostMiddleware<T>) {
		this.middlewareChain.unshift(middleware);
	}
}