import {IScheduler, ScheduledPlan} from '@src/corebus/interfaces';

export default class SequentialScheduler<T> implements IScheduler<T> {
	preserveOrder: boolean;

	constructor(preserveOrder: boolean){
		this.preserveOrder = preserveOrder;
	}

	schedule(events: T[], maxConcurrency?: number): ScheduledPlan<T> {
		return {
			plan: [{
				payloads: events,
				preserveOrder: this.preserveOrder,
			}],
		};
	}
}
