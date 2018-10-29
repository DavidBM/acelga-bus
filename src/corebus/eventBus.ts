import {
	Constructable,
	EventSubscriptionCallback,
	IEventBus,
	IMiddleware,
	EventCallbacksSet,
} from './interfaces';

import {Publisher} from './publisher';
import {Dispatcher} from './dispatchers/single';

export class EventBus<T = {}> implements IEventBus<T> {
	defaultPublisher: Publisher<T> = this.createPublisher();
	dispatcher: Set<Dispatcher<T>> = new Set();
	defaultReceiver: Dispatcher<T> = this.createReceiver();

	public createPublisher(): Publisher<T> {
		return new Publisher((item: T) => this.deliver(item));
	}

	public createReceiver(): Dispatcher<T> {
		const receiver = new Dispatcher<T>();
		this.dispatcher.add(receiver);
		return receiver;
	}

	protected deliver(event: T): Promise<void> {
		const promises: Promise<void>[] = [];
		this.dispatcher.forEach(receiver => promises.push(receiver.trigger(event)));

		return Promise.all(promises)
		.then(() => {});
	}

	public async publish(event: T): Promise<void> {
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
