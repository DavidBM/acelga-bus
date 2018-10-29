import {IScheduler, ScheduledPlan} from '../interfaces';

export default class ParallelScheduler<T> implements IScheduler<T> {
	schedule(events: T[], maxConcurrency?: number): ScheduledPlan<T> {
		if (!Number.isFinite(maxConcurrency as number)
			|| !maxConcurrency
			|| maxConcurrency <= 0
			|| events.length <= maxConcurrency
		) {
			return {
				plan: events.map(event => createResult(false, [event])),
			};
		}

		const plan: Array<T[]> = new Array(maxConcurrency).fill(0).map(() => []);

		events.forEach((event, index) => {
			const pipelineIndex = index - maxConcurrency * Math.floor(index / maxConcurrency);
			plan[pipelineIndex].push(event);
		});

		const clonedPlan = plan.map(pipeline => createResult(false, pipeline.slice(0)));

		return {
			plan: clonedPlan,
		};
	}
}

function createResult<T>(preserveOrder: boolean, payloads: Array<T>) {
	return {
		preserveOrder,
		payloads,
	};
}
