import {Executor} from './executor';
import {MiddlewareChain} from './middlewareChain';
import {
	Constructable, 
	EventSubscriptionCallback, 
	EventCallbacksSet,
	IMiddleware,
} from './interfaces';

export class Receiver<T = {}> {

	middlewareChain: MiddlewareChain<IMiddleware<T>, T> = new MiddlewareChain();
	subscriptions: Map<Constructable<T>, EventCallbacksSet<T>> = new Map();

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void {
		var callbacksSet = this.subscriptions.get(eventType as Constructable<T>);

		if(!callbacksSet) callbacksSet = new Set();

		callbacksSet.add(callback as EventSubscriptionCallback<T>);

		this.subscriptions.set(eventType as Constructable<T>, callbacksSet);
	}

	public async trigger(event: T): Promise<void> {
		const result = await this.middlewareChain.execute(event);
		let callbacks = this.subscriptions.get(event.constructor as Constructable<T>);

		if(!result || !callbacks) return;

		const executor = new Executor<T>(result, ...callbacks);

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

	pushMiddleware(middleware: IMiddleware<T>) {
		this.middlewareChain.push(middleware);
	}

	unshiftMiddleware(middleware: IMiddleware<T>) {
		this.middlewareChain.unshift(middleware);
	}
}