// import * as Google from '@google-cloud/pubsub';
import {GoogleAcknowledger, HTTPGoogleSynchronousSubscriptionClient, HTTPGoogleSynchronousPublisherClient} from './interfaces';
import {GoogleDecodedContract, EventInstanceContract, SubscriptionConfig} from './interfaces';
import {FullSyncronousClient, DecodedEvent, Event} from '../corebus/interfaces';

// as example
// const client = new (pubsub as any).v1.SubscriberClient();
// const client = new (pubsub as any).v1.PublisherClient();

export class GoogleClient <T extends GoogleDecodedContract> implements FullSyncronousClient<T, EventInstanceContract, SubscriptionConfig>{

	protected messagesToGet = 100;

	constructor(
		protected pullClient: HTTPGoogleSynchronousSubscriptionClient,
		protected pushClient: HTTPGoogleSynchronousPublisherClient,
		protected acknowledger: GoogleAcknowledger,
		private projectName: string,
	) {	}

	public async publish(event: Event<T>): Promise<void> {
		const subscriptionPath = this.pullClient.subscriptionPath(this.projectName, event.constructor.name);
		await this.pushClient.publish({topic: subscriptionPath, messages: [{data: Buffer.from(JSON.stringify(event))}]});
	}

	public async getEvents(config: SubscriptionConfig) {
		const subscriptionPath = this.pullClient.subscriptionPath(this.projectName, config.topic);
		return this.pullClient.pull({subscription: subscriptionPath, maxMessages: this.messagesToGet});
	}

	async ack(event: DecodedEvent<T>): Promise<void> {
		await this.acknowledger.ack(event.project, event.origin, [event.ackId]);
	}

	async nack(event: DecodedEvent<T>): Promise<void> {
		await this.acknowledger.nack(event.project, event.origin, [event.ackId]);
	}
}
