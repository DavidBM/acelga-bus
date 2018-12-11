import {IEventBus, EventSubscriptionCallback, BulkDispatcher} from '../index';
import {GoogleDecodedContract, SubscriptionConfig, GoogleEvent} from './interfaces';
import {Constructable, ReceivedEvent, DecodedEvent, EventFactory} from '../corebus/interfaces';
import {SynchronousClientProcessor} from '../corebus/synchronousClientProcessor';
import {EventProcessor} from '../corebus/eventProcessor';
import {GoogleClient} from './client';

export class Google implements GoogleEvent{
	origin: string = 'Google';

	constructor(public data: GoogleDecodedContract) {}
}

class GoogleEventFactory implements EventFactory<Google, GoogleDecodedContract> {
    build(event: DecodedEvent<GoogleDecodedContract>): Google {
        return new Google(event);
    }
}

export class GoogleFacade implements IEventBus {

	constructor(
		private subscription: SynchronousClientProcessor<Google, SubscriptionConfig, GoogleDecodedContract>,
		private client: GoogleClient<Google>,
		private eventProcessor: EventProcessor<Google, GoogleDecodedContract>,
		private dispatcher: BulkDispatcher<Google>,
	) {
		this.eventProcessor.addEventType(Google, new GoogleEventFactory());
	}

	publish(event: Google): Promise<void> {
		return this.client.publish(event);
	}

	public startConsumption() {
		return this.subscription.startConsumption();
	}

	public async stop(): Promise<void> {
		return this.subscription.stop();
	}

	public onAny(callback: EventSubscriptionCallback<Google & ReceivedEvent<Google, GoogleDecodedContract>> ): void {
		return this.dispatcher.onAny(callback as EventSubscriptionCallback<Google>);
	}

	public on(eventType: Constructable<Google>, callback: EventSubscriptionCallback<Google & ReceivedEvent<Google, GoogleDecodedContract>> ): void {
		return this.dispatcher.onAny(callback as EventSubscriptionCallback<Google>);
	}
}
