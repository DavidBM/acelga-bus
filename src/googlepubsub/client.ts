import {BackoffExecutor, BackoffStopper} from '../corebus/backoff';
import {IEmptyTracker} from '../corebus/emptyTracker';
import * as Google from '@google-cloud/pubsub';
import {DecodedSerializedGoogleEvent, GoogleAcknowledger, OriginalType, HTTPGoogleSynchronousSubscriptionClient, HTTPGoogleSynchronousPublisherClient} from './interfaces';
import {ErrorLogger} from '../index';

// as example
// const client = new (pubsub as any).v1.SubscriberClient();
// const client = new (pubsub as any).v1.PublisherClient();

const NO_MESSAGES = Symbol('no messages');

type Handler = (events: DecodedSerializedGoogleEvent[]) => Promise<void>;
export interface SubscriptionDefinition {
	stream: string;
	subscription: string;
}

export class EventstoreClient {

	protected subscriptionsCancellers: BackoffStopper[] = [];
	protected messagesToGet = 100;
	protected handler: null | Handler = null;

	constructor(
		protected pullClient: HTTPGoogleSynchronousSubscriptionClient,
		protected pushClient: HTTPGoogleSynchronousPublisherClient,
		protected acknowledger: GoogleAcknowledger,
		protected logError: ErrorLogger,
		protected backoffStrategy: BackoffExecutor,
		protected eventstoreResponseDecoder: (response: any) => Array<DecodedSerializedGoogleEvent>,
		protected subscriptions: Array<SubscriptionDefinition>,
		protected tracker: IEmptyTracker,
		protected milisecondsToStop: number,
		protected projectName: string,
	) {	}

	public setHandler(handler: Handler) {
		this.handler = handler;
	}

	public startConsumption() {
		this.tracker.remember('running');
		this.subscriptions.forEach(config => this.declareConsumer(config.stream));
	}

	public ping(): Promise<void> {
		return Promise.resolve();
		// return this.client.ping();
	}

	public stop(): Promise<void> {
		this.tracker.forget('running');

		this.subscriptionsCancellers.forEach(canceller => canceller());
		this.subscriptionsCancellers.length = 0;

		return this.tracker.waitUntilEmpty(this.milisecondsToStop)
		.catch(() => {
			this.logError(new TooLongToStop());
		});
	}

	public async publish(streamName: string, eventType: string, event: {}): Promise<void> {
		const subscriptionPath = this.pullClient.subscriptionPath(this.projectName, streamName);
		await this.pushClient.publish({topic: streamName, messages: [{data: Buffer.from(JSON.stringify(event))}]});
	}

	private declareConsumer(subscriptionName: string): void {
		const subscriptionPath = this.pullClient.subscriptionPath(this.projectName, subscriptionName);

		const backoffStopper = this.backoffStrategy(async (continuing, restarting, number, delay) => {
			const trackerId = subscriptionName + number + Math.random();
			this.tracker.remember(trackerId);

			try {
				const response = await this.pullClient.pull({subscription: subscriptionPath, maxMessages: this.messagesToGet});
				const events = this.eventstoreResponseDecoder(response);
				await this.processConsumedResponse(events);
				this.tracker.forget(trackerId);
				restarting();

			} catch (error) {
				if (error === NO_MESSAGES){
					this.tracker.forget(trackerId);
					return continuing();
				}

				this.logError(error);
				this.tracker.forget(trackerId);
				restarting();
			}
		});

		this.subscriptionsCancellers.push(backoffStopper);
	}

	async ack(event: OriginalType): Promise<void> {
		await this.acknowledger.ack(event.project, event.origin, [event.ackId]);
	}

	async nack(event: OriginalType): Promise<void> {
		await this.acknowledger.nack(event.project, event.origin, [event.ackId]);
	}

	protected processConsumedResponse(events: Array<DecodedSerializedGoogleEvent>): Promise<void> {
		if (!Array.isArray(events) || events.length === 0) {
			return Promise.reject(NO_MESSAGES);
		}

		return this.processEvents(events);
	}

	protected processEvents(events: Array<DecodedSerializedGoogleEvent>): Promise<void> {
		if (!this.handler){
			return this.logError(new NoHanlderToProcessEvents(events));
		}

		return this.handler(events);
	}
}

export class NoHanlderToProcessEvents extends Error {
	events: any;

	constructor(events: any) {
		super();
		this.events = events;
		this.message = 'The handler for processing events is still not set. The non-processed events are stored in attribute "events" of this error object';
	}
}

export class TooLongToStop extends Error {
	constructor() {
		super();
		this.message = 'Stopping the server took too much time. Stopping anyway, events may be still in process';
	}
}
