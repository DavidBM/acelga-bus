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
}

export interface IScheduler<T> {
	schedule(items: T[], maxConcurrency?: number): ScheduledPlan<T>;
}

export type ErrorLogger = (...args: unknown[]) => Promise<void>;

export interface IDispatcher<T> {
	on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void;
	onAny(callback: EventSubscriptionCallback<T>): void;
	trigger(event: T): Promise<void>;
	off<T1 extends T>(eventType: Constructable<T1>, callback?: EventSubscriptionCallback<T1> ): void;
}

export interface ExecutionResult<T, R extends T = T> {event: R; error: void | Error; isError: boolean; }

export type PipelineResult<T, R extends T = T> = Array<ExecutionResult<T, R>>;

export type PipelineExecutionResult<T> = Promise<PipelineResult<T>>;

export interface IPipeline<T> {
	executeStopOnError(events: T[]): PipelineExecutionResult<T>;
	executeContinueOnError(events: T[]): PipelineExecutionResult<T>;
}

export type PipelineFactory<T> = (scheduler: IDispatcher<T>) => IPipeline<T>;

export interface EventFactory<T, J> {
	build(serializedEvent: DecodedEvent<J>): Event<T>;
}

export type TypedEvent = {
	eventType: string,
};

export const originalEventSymbol: unique symbol = Symbol('originalEvent');

export type Event<T> = T;

export type DecodedEvent<J> = TypedEvent & J;

export type ReceivedEvent<T, J> = Event<T> & {
	[originalEventSymbol]: DecodedEvent<J>;
};

export interface AcknowledgeableClient<J> {
	ack(event: DecodedEvent<J>): Promise<void>;
	nack(event: DecodedEvent<J>): Promise<void>;
}

export interface PullBasicClient<C> {
	getEvents(config: C): Promise<any>;
}

export interface PushBasicClient<E, J> {
	publish(event: ReceivedEvent<E, J>): Promise<void>;
}

export interface FullSyncronousClient<E, J, C> extends AcknowledgeableClient<J>, PullBasicClient<C>, PushBasicClient<E, J> {}

export interface EventProcessingLogic<E, R> {
	processEvents(events: DecodedEvent<R>[]): Promise<void>;
}
