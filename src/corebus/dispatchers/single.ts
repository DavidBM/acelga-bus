import {Executor} from '../executor';
import {
	Constructable,
	EventSubscriptionCallback,
	EventCallbacksSet,
} from '../interfaces';

export class Dispatcher<T = {}> {

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
		if (!event) return;

		const callbacks = this.subscriptions.get(event.constructor as Constructable<T>);

		const future = [];

		if (callbacks){
			future.push(new Executor<T>(event, ...callbacks));
		}

		if (this.globalSubscriptions.size){
			future.push(new Executor<T>(event, ...this.globalSubscriptions));
		}

		return Promise.all(future.map(executor => executor.execStopOnFail()))
		.then(() => {});
	}

	public isListened(eventType: Constructable<T>): boolean {
		return !!this.subscriptions.get(eventType);
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
}
