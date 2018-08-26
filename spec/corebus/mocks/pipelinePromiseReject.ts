import {IDispatcher, PipelineExecutionResult, IPipeline} from '@src/corebus/interfaces';

export class PipelinePromiseReject<T> implements IPipeline<T> {

	constructor(dispatcher: IDispatcher<T>) {
	}

	executeStopOnError(events: T[]): PipelineExecutionResult<T> {
		return Promise.reject(new Error('executeStopOnError'));
	}

	executeContinueOnError(events: T[]): PipelineExecutionResult<T> {
		return Promise.reject(new Error('executeContinueOnError'));
	}
}

export function pipelinePromiseRejectFactory<T>(scheduler: IDispatcher<T>): IPipeline<T> {
	return new PipelinePromiseReject(scheduler);
}
