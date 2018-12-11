import {DecodedEvent, PullBasicClient, EventProcessingLogic} from '../corebus/interfaces';
import {BackoffExecutor, BackoffStopper} from '../corebus/backoff';
import {IEmptyTracker} from '../corebus/emptyTracker';
import {ErrorLogger} from '../index';

const NO_MESSAGES = Symbol('no messages');
// E: Event contract,  SC: Subcription config (accepted as array for multiple subscriptions, DC: DecodedEvent subtype
export class SynchronousClientProcessor<E, SC, DE>{
	protected subscriptionsCancellers: BackoffStopper[] = [];
	protected messagesToGet = 100;

	constructor(
		protected client: PullBasicClient<SC>,
		protected eventProcessor: EventProcessingLogic<E, DE>,
		protected logError: ErrorLogger,
		protected backoffStrategy: BackoffExecutor,
		protected eventstoreResponseDecoder: (response: any, subscriptionConfig: SC) => Array<DecodedEvent<DE>>,
		protected subscriptions: Array<SC>,
		protected tracker: IEmptyTracker,
		protected milisecondsToStop: number,
	) {	}

	public startConsumption() {
		this.tracker.remember('running');
		this.subscriptions.forEach(config => this.declareConsumer(config));
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

	private declareConsumer(config: SC): void {
		const backoffStopper = this.backoffStrategy(async (continuing, restarting, number, delay) => {
			const trackerId = number + Math.random();
			this.tracker.remember(trackerId);

			try {
				const response = await this.client.getEvents(config);
				const events = this.eventstoreResponseDecoder(response, config);
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

	protected processConsumedResponse(events: Array<DecodedEvent<DE>>): Promise<void> {
		if (!Array.isArray(events) || events.length === 0) {
			return Promise.reject(NO_MESSAGES);
		}

		return this.eventProcessor.processEvents(events);
	}
}

export class TooLongToStop extends Error {
	constructor() {
		super();
		this.message = 'Stopping the server took too much time. Stopping anyway, events may still be processing';
	}
}
