import {Dispatcher} from '../dispatchers/single';
import {IPipeline, PipelineExecutionResult, ExecutionResult, IDispatcher} from '../../corebus/interfaces';

export class Pipeline<T> implements IPipeline<T> {
	dispatcher: IDispatcher<T>;

	constructor(dispatcher: IDispatcher<T>) {
		this.dispatcher = dispatcher;
	}

	async executeStopOnError(events: T[]): PipelineExecutionResult<T> {
		const result = [];
		// We do old style loop because is better for getting index & value with flow instructions and await
		// tslint:disable-next-line
		for (let index = 0; index < events.length; index++) {
			const event = events[index];
			try {
				await this.dispatcher.trigger(event);
				result[index] = {error: null, event, isError: false};
			} catch (error) {
				result[index] = {error, event, isError: true};
				this.mapNotExecutedEvents(events, index + 1, result);
				break;
			}
		}

		return result;
	}

	async executeContinueOnError(events: T[]): PipelineExecutionResult<T> {
		const result = [];
		// We do old style loop because is better for getting index & value with flow instructions and await
		// tslint:disable-next-line
		for (let index = 0; index < events.length; index++) {
			const event = events[index];
			try {
				await this.dispatcher.trigger(event);
				result[index] = {error: null, event, isError: false};
			} catch (error) {
				result[index] = {error, event, isError: true};
			}
		}

		return result;
	}

	protected mapNotExecutedEvents(events: T[], startIndex: number, result: ExecutionResult<T>[]) {
		return events.slice(startIndex)
		.forEach((remainingEvent, index) => {
			result[index + startIndex] = {
				error: new NotExecutedByOrderDependency(),
				event: remainingEvent,
				isError: true,
			};
		});
	}
}

export class NotExecutedByOrderDependency extends Error {
	constructor() {
		super();
		this.message = 'The pipeline was configured to preserve the order of the execution. One item fail and block the order of the other items. You can retry or remove that item when you create the new pipeline.';
	}
}
