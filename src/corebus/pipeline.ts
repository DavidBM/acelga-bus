import {Dispatcher} from './dispatcher';
import {IPipeline, PipelineExecutionResult, IDispatcher} from './interfaces';

export class Pipeline<T> implements IPipeline<T> {
	dispatcher: IDispatcher<T>;

	constructor(dispatcher: IDispatcher<T>) {
		this.dispatcher = dispatcher;
	}

	async executeStopOnError(events: T[]): PipelineExecutionResult<T> {
		// We do old style loop, because is better for getting index & value, flow instructions and await
		// tslint:disable-next-line
		for (let index = 0; index < events.length; index++) {
			const event = events[index];
			try {
				await this.dispatcher.trigger(event);
			} catch (error) {
				return [{error, event}, ...this.mapNotExecutedEvents(events, index + 1)];
			}
		}
	}

	async executeContinueOnError(events: T[]): PipelineExecutionResult<T> {
		const errors = [];

		for (const event of events) {
			try {
				await this.dispatcher.trigger(event);
			} catch (error) {
				errors.push({error, event});
			}
		}

		return errors.length ? errors : undefined;
	}

	protected mapNotExecutedEvents(events: T[], index: number) {
		return events.slice(index).map(remainingEvent => { return {
			error: new NotExecutedByOrderPresentation(),
			event: remainingEvent,
		}; });
	}
}

export class NotExecutedByOrderPresentation extends Error {
	constructor() {
		super();
		this.message = 'The pipeline was configures to preserve the order of the execution. One item fail and block the order of the other items. You can retry or remove that item when you create the new pipeline.';
	}
}
