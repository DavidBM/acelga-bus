import {BackoffExecutor, BackoffStopper} from './backoff';
import {HTTPClient, EmbedType} from 'geteventstore-promise';
import {IDecodedSerializedEventstoreEvent, EventstoreFeedbackHTTP, IEmptyTracker} from './interfaces';
import {ErrorLogger} from '../index';
import {decodeEventstoreResponse} from './utils';

const NO_MESSAGES = Symbol('no messages');

type Handler = (events: IDecodedSerializedEventstoreEvent[]) => Promise<void>;
export interface SubscriptionDefinition {
	stream: string;
	subscription: string;
}

export class EventstoreClient {
	protected client: HTTPClient;
	protected backoffStrategy: BackoffExecutor;
	protected messagesToGet = 100;
	protected handler: null | Handler = null;
	protected logError: ErrorLogger;
	protected signal: EventstoreFeedbackHTTP;
	protected subscriptions: SubscriptionDefinition[];
	protected subscriptionsCancellers: BackoffStopper[];
	protected tracker: IEmptyTracker;
	protected milisecondsToStop: number;
	protected eventstoreResponseDecoder: (response: any) => Array<IDecodedSerializedEventstoreEvent>;

	constructor(
		client: HTTPClient,
		signalInterface: EventstoreFeedbackHTTP,
		errorLogger: ErrorLogger,
		backoffStrategy: BackoffExecutor,
		eventstoreResponseDecoder: (response: any) => Array<IDecodedSerializedEventstoreEvent>,
		subscriptions: Array<SubscriptionDefinition>,
		tracker: IEmptyTracker,
		milisecondsToStop: number,
	) {
		this.client = client;
		this.backoffStrategy = backoffStrategy;
		this.logError = errorLogger;
		this.signal = signalInterface;
		this.subscriptions = subscriptions;
		this.subscriptionsCancellers = [];
		this.tracker = tracker;
		this.milisecondsToStop = milisecondsToStop;
		this.eventstoreResponseDecoder = eventstoreResponseDecoder;
	}

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

	protected processConsumedAnswer(events: Array<IDecodedSerializedEventstoreEvent>): Promise<void> {
		if (!Array.isArray(events) || events.length === 0) {
			return Promise.reject(NO_MESSAGES);
		}

		return this.processEvents(events);
	}

	protected processEvents(events: Array<IDecodedSerializedEventstoreEvent>): Promise<void> {
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
