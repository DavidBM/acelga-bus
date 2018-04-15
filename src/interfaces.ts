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

export interface IEvent {};

export type EventSubscriptionCallbackReturnType = Promise<void|Error> | void;

export type EventSubscriptionCallback<T = IEvent> = (event: T) => EventSubscriptionCallbackReturnType; 

export interface IEventBus<T = IEvent> {
	subscriptions: WeakMap<Constructable<T>, Set<EventSubscriptionCallback<T>>>
	publish(event: T): Promise<(void|Error)[]|void>
	on(event: Constructable<T>, callback: EventSubscriptionCallback<T>): void
}
/*
export interface IEventFactory<T extends IEvent = Event> {
	build(serializedEvent: JsonizableInterface): T;
	getEventType(): Constructable<T>;
}
*/
