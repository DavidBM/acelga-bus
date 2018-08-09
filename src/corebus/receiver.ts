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
	globalSubscriptions: EventCallbacksSet<T> = new Set();

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void {
		let callbacksSet = this.subscriptions.get(eventType as Constructable<T>);

		if (!callbacksSet) callbacksSet = new Set();

		callbacksSet.add(callback as EventSubscriptionCallback<T>);

		this.subscriptions.set(eventType as Constructable<T>, callbacksSet);
	}

	public onAny(callback: EventSubscriptionCallback<T>): void {
		this.globalSubscriptions.add(callback);
	}

	public async trigger(event: T): Promise<void> {
		const result = await this.middlewareChain.execute(event);
		const callbacks = this.subscriptions.get(event.constructor as Constructable<T>);

		if (!result) return;

		const future = [];

		if(callbacks){
			future.push(new Executor<T>(result, ...callbacks))
		}

		if(this.globalSubscriptions.size){
			future.push(new Executor<T>(result, ...this.globalSubscriptions))
		}

		return Promise.all(future.map(executor => executor.execStopOnFail()))
		.then(() => {});
	}

	public off<T1 extends T>(eventType: Constructable<T1>, callback?: EventSubscriptionCallback<T1> ): void {

		if (!callback){
			this.subscriptions.delete(eventType);
			return;
		}

		const callbacks = this.subscriptions.get(eventType as Constructable<T>);

		if (!callbacks) return;

		callbacks.delete(callback as EventSubscriptionCallback<T>);
	}

	pushMiddleware(middleware: IMiddleware<T>) {
		this.middlewareChain.push(middleware);
	}

	unshiftMiddleware(middleware: IMiddleware<T>) {
		this.middlewareChain.unshift(middleware);
	}
}
