import {
	Constructable,
	IEvent, 
	EventSubscriptionCallback, 
	EventSubscriptionCallbackReturnType, 
	IEventBus
} from './interfaces';

import {Executor} from './executor';


export class EventBus<T = IEvent> implements IEventBus<T> {
	subscriptions: WeakMap<Constructable<T>, Set<EventSubscriptionCallback<T>>>

	constructor() {
		this.subscriptions = new WeakMap();
	}

	publish(event: T): Promise<any> {
		const callbacks = this.subscriptions.get(event.constructor as Constructable<T>);

		if(!callbacks) return Promise.resolve()

		const executor = new Executor<T>(event, ...callbacks);

		return executor.execStopOnFail();
	}

	on(eventType: Constructable<T>, callback: EventSubscriptionCallback<T>): void {
		var callbacksSet = this.subscriptions.get(eventType as Constructable<T>);

		if(!callbacksSet) callbacksSet = new Set();

		callbacksSet.add(callback);

		this.subscriptions.set(eventType as Constructable<T>, callbacksSet);
	}
}
