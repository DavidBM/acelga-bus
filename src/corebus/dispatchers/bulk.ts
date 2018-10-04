import {Dispatcher} from './single';
import {Pipeline} from '@src/corebus/pipeline';
import {
	Constructable,
	EventSubscriptionCallback,
	IScheduler,
	ErrorLogger,
	PipelinePlan,
	PipelineResult,
	ExecutionResult,
	PipelineExecutionResult,
	PipelineFactory,
} from '@src/corebus/interfaces';

export default class BulkDispatcher<T> {
	dispatcher: Dispatcher<T>;
	scheduler: IScheduler<T>;
	pipelineFactory: PipelineFactory<T>;
	errorLogger: ErrorLogger;

	constructor(dispatcher: Dispatcher<T>, scheduler: IScheduler<T>, pipelineFactory: PipelineFactory<T>, errorLogger: ErrorLogger) {
		this.dispatcher = dispatcher;
		this.scheduler = scheduler;
		this.pipelineFactory = pipelineFactory;
		this.errorLogger = errorLogger;
	}

	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void {
		return this.dispatcher.on(eventType, callback);
	}

	public onAny(callback: EventSubscriptionCallback<T>): void {
		return this.dispatcher.onAny(callback);
	}

	public async trigger<R extends T = T>(events: R[]): Promise<ExecutionResult<T, R>[]> {
		try {
			const plan = this.scheduler.schedule(events);
			const pipelinesPromises = plan.plan.map(pipelinePlan => this.executePipelinePlan(pipelinePlan));

			const results: any[] = await this.mapPipelinePromises(pipelinesPromises);

			const errors = this.getAllErrors<R>(results);

			if (errors.length){
				return Promise.resolve(errors);
			}

			return [];
		} catch (error) {
			this.errorLogger(error);
			return Promise.reject(error);
		}
	}

	protected getAllErrors<R extends T = T>(results: Array<PipelineResult<T, R>>): ExecutionResult<T, R>[] {
		const errors: PipelineResult<T, R> = [];

		results.forEach(result => {
			result.forEach(error => errors.push(error));
		});

		return errors;
	}

	public isListened(eventType: Constructable<T>): boolean {
		return this.dispatcher.isListened(eventType);
	}

	protected executePipelinePlan(pipelinePlan: PipelinePlan<T>) {
		const pipeline = this.pipelineFactory(this.dispatcher);

		if (pipelinePlan.preserveOrder)
			return pipeline.executeStopOnError(pipelinePlan.payloads);

		return pipeline.executeContinueOnError(pipelinePlan.payloads);
	}

	protected async mapPipelinePromises(pipelines: PipelineExecutionResult<T>[]){
		const results: any[] = [];

		const pipelinesPromises = pipelines.map((pipeline, index) => {
			return pipeline
			.then(result => results[index] = result)
			.catch((error: any) => this.errorLogger(error));
		});

		await Promise.all(pipelinesPromises);
		return results;
	}

	public off<T1 extends T>(eventType: Constructable<T1>, callback?: EventSubscriptionCallback<T1> ): void {
		this.dispatcher.off(eventType, callback);
	}
}
