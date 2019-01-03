import {HTTPGoogleSynchronousSubscriptionClient, HTTPGoogleSynchronousPublisherClient} from './interfaces';
import {EventInstanceContract, GoogleDecodedContract, SubscriptionConfig} from './interfaces';
import {FullSyncronousClient, DecodedEvent, Event} from '../corebus/interfaces';

export class GoogleClient <T extends EventInstanceContract> implements FullSyncronousClient<T, GoogleDecodedContract, SubscriptionConfig>{

	protected messagesToGet = 100;

	constructor(
		private projectName: string,
		keyFileName: string,
		protected pullClient: HTTPGoogleSynchronousSubscriptionClient,
		protected pushClient: HTTPGoogleSynchronousPublisherClient,
	) {	}

	public async publish(event: Event<T>): Promise<void> {
		const subscriptionPath = this.pushClient.topicPath(this.projectName, event.origin);
		await this.pushClient.publish({topic: subscriptionPath, messages: [{data: Buffer.from(JSON.stringify(event))}]});
	}

	public getEvents(config: SubscriptionConfig) {
		const subscriptionPath = this.pullClient.subscriptionPath(this.projectName, config.subscriptionName);
		return this.pullClient.pull({subscription: subscriptionPath, maxMessages: this.messagesToGet});
	}

	public ack(event: DecodedEvent<GoogleDecodedContract>): Promise<void> {
		const subscriptionPath = this.pullClient.subscriptionPath(this.projectName, event.subscription);
		return this.pullClient.acknowledge({subscription: subscriptionPath, ackIds: [event.ackId]});
	}

	public nack(event: DecodedEvent<GoogleDecodedContract>): Promise<void> {
		const subscriptionPath = this.pullClient.subscriptionPath(this.projectName, event.subscription);
		return this.pullClient.modifyAckDeadline({subscription: subscriptionPath, ackIds: [event.ackId], ackDeadlineSeconds: 0});
	}
}
