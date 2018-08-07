import {
	Constructable,
	EventSubscriptionCallback,
	IEventBus,
	IMiddleware,
	EventCallbacksSet,
} from './interfaces';

import {Executor} from './executor';
import {Publisher} from './publisher';
import {Receiver} from './receiver';

export class EventBus<T = {}> implements IEventBus<T> {
	middlewares: IMiddleware<T>[] = [];
	defaultPublisher: Publisher<T> = this.createPublisher();
	receivers: Set<Receiver<T>> = new Set();
	defaultReceiver: Receiver<T> = this.createReceiver();

	public createPublisher(): Publisher<T> {
		return new Publisher((item: T) => this.deliver(item));
	}

	public createReceiver(): Receiver<T> {
		const receiver = new Receiver<T>();
		this.receivers.add(receiver);
		return receiver;
	}

	protected deliver(event: T): Promise<void> {
		const promises: Promise<void>[] = [];
		this.receivers.forEach(receiver => promises.push(receiver.trigger(event)));

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
