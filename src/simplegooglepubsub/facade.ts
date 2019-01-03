import {IEventBus, EventSubscriptionCallback, BulkDispatcher} from '../index';
import {GoogleDecodedContract, SubscriptionConfig} from './interfaces';
import {Constructable, ReceivedEvent} from '../corebus/interfaces';
import {SynchronousClientProcessor} from '../corebus/synchronousClientProcessor';
import {GoogleClient} from './client';
import {Google} from './eventFactory';

export class GoogleFacade<T extends Google> implements IEventBus {
	private subscribed  = false;

	constructor(
		private subscription: SynchronousClientProcessor<T, SubscriptionConfig, GoogleDecodedContract>,
		private client: GoogleClient<T>,
		private dispatcher: BulkDispatcher<T>,
	) {}

	publish(event: T): Promise<void> {
		return this.client.publish(event);
	}

	public startConsumption() {
		return this.subscription.startConsumption();
	}

	public async stop(): Promise<void> {
		return this.subscription.stop();
	}

	public onAny(callback: EventSubscriptionCallback<T & ReceivedEvent<T, GoogleDecodedContract>> ): void {
		if (this.subscribed) return;
		this.subscribed = true;
		return this.dispatcher.onAny(callback as EventSubscriptionCallback<T>);
	}

	public on(eventType: Constructable<T>, callback: EventSubscriptionCallback<T & ReceivedEvent<T, GoogleDecodedContract>> ): void {
		if (this.subscribed) return;
		this.subscribed = true;
		return this.dispatcher.onAny(callback as EventSubscriptionCallback<T>);
	}
}
