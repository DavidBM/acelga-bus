import {EventEmitter} from 'events';

export interface IEmptyTracker {
	remember(item: any): void;
	forget(item: any): void;
	on(type: 'empty', callback: (...args: any[]) => any ): void;
	isEmpty(): boolean;
	waitUntilEmpty(timeout: number): Promise<void>;
}

export class EmptyTracker extends EventEmitter implements IEmptyTracker{
	activeItems: Set<any> = new Set();

	remember(item: any) {
		this.activeItems.add(item);
	}

	forget(item: any) {
		this.activeItems.delete(item);
		if (this.isEmpty()) {
			this.emit('empty');
		}
	}

	isEmpty() {
		return this.activeItems.size === 0;
	}

	waitUntilEmpty(timeout: number): Promise<void> {
		return new Promise((succeed, reject) => {
			if (this.isEmpty())
				return succeed();

			this.on('empty', succeed);
			if (Number.isFinite(timeout) && timeout >= 0)
				setTimeout(reject, timeout);
		});
	}
}
