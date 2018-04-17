import {
	Constructable,
	IEvent, 
	EventSubscriptionCallback, 
	IEventBus,
	IMiddleware,
	EventCallbacksSet
} from './interfaces';

import {Executor} from './executor';
import {Publisher} from './publisher';

export class EventBus<T = IEvent> implements IEventBus<T> {
	subscriptions: WeakMap<Constructable<T>, EventCallbacksSet<T>> = new WeakMap();
	middlewares: IMiddleware<T>[] = [];
	defaultPublisher: Publisher<T>;

	constructor(){
		this.defaultPublisher = new Publisher((item: T, original: T) => this.dispatch(item, original));
	}

	public async publish(event: T): Promise<any> {
		this.defaultPublisher.publish(event);
	}

	public createPublisher(): Publisher<T> {
		return new Publisher((item: T, original: T) => this.dispatch(item, original));
	}

	private async dispatch(event: T, original: T){
		let callbacks = this.subscriptions.get(original.constructor as Constructable<T>);

		if(!callbacks) return Promise.resolve();

		const executor = new Executor<T>(event, ...callbacks);

		return executor.execStopOnFail();
	}

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void {
		var callbacksSet = this.subscriptions.get(eventType as Constructable<T>);

		if(!callbacksSet) callbacksSet = new Set();

		callbacksSet.add(callback as EventSubscriptionCallback<T>);

		this.subscriptions.set(eventType as Constructable<T>, callbacksSet);
	}

	public pushMiddleware(middleware: IMiddleware<T>): void{
		this.defaultPublisher.unshiftMiddleware(middleware);
	}

	public unshiftMiddleware(middleware: IMiddleware<T>){
		this.defaultPublisher.pushMiddleware(middleware);
	}
}
