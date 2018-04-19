import {IEvent} from './interfaces'
import {EventSubscriptionCallback} from './interfaces'

export class Executor<T> {
	item: T;
	callbacks: EventSubscriptionCallback<T>[];

	constructor(item: T, ...callbacks: EventSubscriptionCallback<T>[]) {
		this.item = item;
		this.callbacks = callbacks;
	}

	execStopOnFail(): Promise<void>{
		try{
			var callbacks = this.callbacks.map(callback => callback(this.item));
			return Promise.all(callbacks)
			.then(() => {});
		}catch(e){
			return Promise.reject(e);
		}
	}

	add(callback: EventSubscriptionCallback<T>): void {
		this.callbacks.push(callback);
	}
}
