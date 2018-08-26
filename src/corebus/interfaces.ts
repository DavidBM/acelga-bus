/*
Generic interfaces
*/

export interface Constructable<T = {}>{
	new (...args: any[]): T;
}

export type EventIdentifier<T> = (Constructable<T>);

export type JsonizableType = number | string | JsonizableInterface | Array<JsonizableInterface> | {toJSON: (arg: string) => string};

export interface JsonizableInterface {
	[key: string]: JsonizableType;
}

export interface Serializable {
	serialize(): JsonizableInterface;
}

/*
EventBus interfaces
*/

export type EventSubscriptionCallbackReturnType = Promise<void|Error> | void;

export type EventSubscriptionCallback<T = {}> = (event: T) => EventSubscriptionCallbackReturnType;

export type EventCallbacksSet<T> = Set<EventSubscriptionCallback<T>>;

export interface IEventBus<T = {}> {
	publish(event: T): Promise<(void|Error)[]|void>;
	on(event: Constructable<T>, callback: EventSubscriptionCallback<T>): void;
}

export type IMiddleware<T = {}> = (item: T) => Promise<T | void> | T | void;

export interface PipelinePlan<T> {
	preserveOrder: boolean;
	payloads: T[];
}

export interface ScheduledPlan<T> {
	plan: PipelinePlan<T>[];
	rebuildOrder: (results: Array<any[]>) => any[];
}

export interface IScheduler<T> {
	schedule(items: T[], maxConcurrency?: number): ScheduledPlan<T>;
}

export type ErrorLogger = (...args: unknown[]) => void;

export interface IDispatcher<T> {
	on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void;
	onAny(callback: EventSubscriptionCallback<T>): void;
	trigger(event: T): Promise<void>;
	off<T1 extends T>(eventType: Constructable<T1>, callback?: EventSubscriptionCallback<T1> ): void;
}

export type PipelineResult<T> = void | Array<{event: T, error: Error}>;

export type PipelineExecutionResult<T> = Promise<PipelineResult<T>>;

export interface IPipeline<T> {
	executeStopOnError(events: T[]): PipelineExecutionResult<T>;
	executeContinueOnError(events: T[]): PipelineExecutionResult<T>;
}

export type PipelineFactory<T> = (scheduler: IDispatcher<T>) => IPipeline<T>;
