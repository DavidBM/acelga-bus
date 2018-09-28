import {EventEmitter} from 'events';
import {IEmptyTracker} from './interfaces';

export class EmptyTracker extends EventEmitter implements IEmptyTracker{
	activeItems: Set<any> = new Set();

	remember(item: any) {
		this.activeItems.add(item);
	}

	forget(item: any) {
		this.activeItems.delete(item);
		if(this.activeItems.size === 0) {
			this.emit('empty');
		}
	}

	isEmpty() {
		return this.activeItems.size === 0;
	}

	waitUntilEmpty(timeout: number): Promise<void> {
		return new Promise((succeed, reject) => {
			if(this.isEmpty())
				return succeed();

			this.on('empty', succeed);
			if(Number.isFinite(timeout) && timeout >= 0)
				setTimeout(reject, timeout)
		});
	}
}
