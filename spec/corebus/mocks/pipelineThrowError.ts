import {IDispatcher, PipelineExecutionResult, IPipeline} from '@src/corebus/interfaces';

export class PipelineThrowError<T> implements IPipeline<T> {

	constructor(dispatcher: IDispatcher<T>) {
	}

	executeStopOnError(events: T[]): PipelineExecutionResult<T> {
		throw new Error('executeStopOnError');
	}

	executeContinueOnError(events: T[]): PipelineExecutionResult<T> {
		throw new Error('executeContinueOnError');
	}
}

export function pipelineThrowErrorFactory<T>(scheduler: IDispatcher<T>): IPipeline<T> {
	return new PipelineThrowError(scheduler);
}
