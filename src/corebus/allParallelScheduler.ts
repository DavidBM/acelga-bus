import {Scheduler} from './interfaces';

export default class AllParallelScheduler<T> implements Scheduler<T> {
	schedule(events: T[], maxConcurrency?: number): Array<T[]> {

		if (!Number.isFinite(maxConcurrency as number)
			|| !maxConcurrency
			|| maxConcurrency <= 0
			|| events.length <= maxConcurrency
		) {
			return events.map(event => [event]);
		}

		const plan: Array<T[]> = new Array(maxConcurrency).fill(0).map(() => []);

		events.forEach((event, index) => {
			const pipelineIndex = index - maxConcurrency * Math.floor(index / maxConcurrency);
			plan[pipelineIndex].push(event);
		});

		return plan;
	}
}
