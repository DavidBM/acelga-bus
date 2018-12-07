import {
	Constructable,
	EventSubscriptionCallback,
	ExecutionResult,
} from '../../../../src/corebus/interfaces';

export class BulkDispatcher<T> {
	public on<T1 extends T>(eventType: Constructable<T1>, callback: EventSubscriptionCallback<T1> ): void {
		return;
	}

	public onAny(callback: EventSubscriptionCallback<T>): void {
		return;
	}

	public trigger<R extends T = T>(events: R[]): Promise<ExecutionResult<T, R>[]> {
		return Promise.resolve([]);
	}

	public isListened(eventType: Constructable<T>): boolean {
		return true;
	}

	public off<T1 extends T>(eventType: Constructable<T1>, callback?: EventSubscriptionCallback<T1> ): void {
		return;
	}
}
