import {IDispatcher, PipelineExecutionResult, IPipeline} from '@src/corebus/interfaces';

export class PipelinePromiseReject<T> implements IPipeline<T> {

	constructor(dispatcher: IDispatcher<T>) {
	}

	executeStopOnError(events: T[]): PipelineExecutionResult<T> {
		return Promise.reject(new Error('executeStopOnError (error from Mock)'));
	}

	executeContinueOnError(events: T[]): PipelineExecutionResult<T> {
		return Promise.reject(new Error('executeContinueOnError (error from Mock)'));
	}
}

export function pipelinePromiseRejectFactory<T>(scheduler: IDispatcher<T>): IPipeline<T> {
	return new PipelinePromiseReject(scheduler);
}
