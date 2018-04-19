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
import {Receiver} from './receiver';

export class EventBus<T = IEvent> implements IEventBus<T> {
	subscriptions: WeakMap<Constructable<T>, EventCallbacksSet<T>> = new WeakMap();
	middlewares: IMiddleware<T>[] = [];
	defaultPublisher: Publisher<T> = this.createPublisher();
	defaultReceiver: Receiver<T> = new Receiver();
	receivers: Set<Receiver<T>> = new Set([this.defaultReceiver]);

	public createPublisher(): Publisher<T> {
		return new Publisher((item: T) => this.distributeEvent(item));
	}

	public createReceiver(): Receiver<T> {
		const receiver = new Receiver<T>();
		this.receivers.add(receiver);
		return receiver;
	}

	private distributeEvent(event: T): Promise<void> {
		const promises: Promise<void>[] = [];
		this.receivers.forEach(receiver => promises.push(receiver.trigger(event)));

		return Promise.all(promises)
		.then(() => {});
	}

	public async publish(event: T): Promise<any> {
		this.defaultPublisher.publish(event);
	}

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void {
		return this.defaultReceiver.on(eventType, callback);
	}

	public pushMiddleware(middleware: IMiddleware<T>): void{
		this.defaultPublisher.unshiftMiddleware(middleware);
	}

	public unshiftMiddleware(middleware: IMiddleware<T>){
		this.defaultPublisher.pushMiddleware(middleware);
	}
}
