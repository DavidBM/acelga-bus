/*
Generic interfaces
*/

export interface Constructable<T = {}>{
	new (...args: any[]): T
}

export type EventIdentifier<T> = (Constructable<T>);

export type JsonizableType = number | string | JsonizableInterface | Array<JsonizableInterface> | {toJSON: (arg: string) => string};

export interface JsonizableInterface {
	[key: string]: JsonizableType;
};

export interface Serializable {
	serialize(): JsonizableInterface
}

/*
EventBus interfaces
*/


export type EventSubscriptionCallbackReturnType = Promise<void|Error> | void;

export type EventSubscriptionCallback<T = {}> = (event: T) => EventSubscriptionCallbackReturnType; 

export type EventCallbacksSet<T> = Set<EventSubscriptionCallback<T>>;

export interface IEventBus<T = {}> {
	subscriptions: WeakMap<Constructable<T>, Set<EventSubscriptionCallback<T>>>
	publish(event: T): Promise<(void|Error)[]|void>
	on(event: Constructable<T>, callback: EventSubscriptionCallback<T>): void
}
/*
export interface IEventFactory<T = IEvent> {
	build(serializedEvent: JsonizableInterface): T;
	getEventType(): Constructable<T>;
}
*/

export interface IMiddleware<T = {}> {
	(event: T): Promise<T | void> | T | void;
}
