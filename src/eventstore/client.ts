import {BackoffExecutor, BackoffStopper} from '../corebus/backoff';
import {IEmptyTracker} from '../corebus/emptyTracker';
import {HTTPClient, EmbedType} from 'geteventstore-promise';
import {DecodedSerializedEventstoreEvent, EventstoreFeedbackHTTP} from './interfaces';
import {ErrorLogger} from '../index';
import {decodeEventstoreResponse} from './utils';

const NO_MESSAGES = Symbol('no messages');

type Handler = (events: DecodedSerializedEventstoreEvent[]) => Promise<void>;
export interface SubscriptionDefinition {
	stream: string;
	subscription: string;
}

export class EventstoreClient {

	protected subscriptionsCancellers: BackoffStopper[] = [];
	protected messagesToGet = 100;
	protected handler: null | Handler = null;

	constructor(
		protected client: HTTPClient,
		protected signal: EventstoreFeedbackHTTP,
		protected logError: ErrorLogger,
		protected backoffStrategy: BackoffExecutor,
		protected eventstoreResponseDecoder: (response: any) => Array<DecodedSerializedEventstoreEvent>,
		protected subscriptions: Array<SubscriptionDefinition>,
		protected tracker: IEmptyTracker,
		protected milisecondsToStop: number,
	) {	}

	public setHandler(handler: Handler) {
		this.handler = handler;
	}

	public startConsumption() {
		this.tracker.remember('running');
		this.subscriptions.forEach(config => this.declareConsumers(config.subscription, config.stream));
	}

	public ping(): Promise<void> {
		return this.client.ping();
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
		return this.client.writeEvent(streamName, eventType, event); // Asuming good serialization
	}

	private declareConsumers(subscriptionName: string, streamName: string): void {
		const backoffStopper = this.backoffStrategy(async (continuing, restarting, number, delay) => {
			const trackerId = streamName + number + Math.random();
			this.tracker.remember(trackerId);

			try {
				const response = await this.client.persistentSubscriptions.getEvents(subscriptionName, streamName, this.messagesToGet, 'body');
				const events = this.eventstoreResponseDecoder(response);
				await this.processConsumedAnswer(events);
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

	async ack(url: string): Promise<void> {
		await this.signal(url);
	}

	async nack(url: string): Promise<void> {
		await this.signal(url);
	}

	protected processConsumedAnswer(events: Array<DecodedSerializedEventstoreEvent>): Promise<void> {
		if (!Array.isArray(events) || events.length === 0) {
			return Promise.reject(NO_MESSAGES);
		}

		return this.processEvents(events);
	}

	protected processEvents(events: Array<DecodedSerializedEventstoreEvent>): Promise<void> {
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
