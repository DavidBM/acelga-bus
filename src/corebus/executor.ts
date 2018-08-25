import {EventSubscriptionCallback} from './interfaces';

export class Executor<T> {
	item: T;
	callbacks: EventSubscriptionCallback<T>[];

	constructor(item: T, ...callbacks: EventSubscriptionCallback<T>[]) {
		this.item = item;
		this.callbacks = callbacks;
	}

	execStopOnFail(): Promise<void>{
		try{
			const callbacks = this.callbacks.map(callback => callback(this.item));
			return Promise.all(callbacks)
			.then(() => {});
		}catch (e){
			return Promise.reject(e);
		}
	}

	add(callback: EventSubscriptionCallback<T> | EventSubscriptionCallback<T>[]): void {
		if (Array.isArray(callback)){
			this.callbacks.push(...callback);
			return;
		}

		this.callbacks.push(callback);
	}
}
