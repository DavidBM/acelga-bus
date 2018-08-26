import {IScheduler, ScheduledPlan} from './interfaces';

export default class AllParallelScheduler<T> implements IScheduler<T> {
	schedule(events: T[], maxConcurrency?: number): ScheduledPlan<T> {

		if (!Number.isFinite(maxConcurrency as number)
			|| !maxConcurrency
			|| maxConcurrency <= 0
			|| events.length <= maxConcurrency
		) {
			return {
				plan: events.map(event => { return {
					payloads: [event],
					preserveOrder: false,
				}; }),
				rebuildOrder: create1to1Mapper<T>(),
			};
		}

		const plan: Array<T[]> = new Array(maxConcurrency).fill(0).map(() => []);
		const indexMapping: Array<number[]> = new Array(maxConcurrency).fill(0).map(() => []);

		events.forEach((event, index) => {
			const pipelineIndex = index - maxConcurrency * Math.floor(index / maxConcurrency);
			plan[pipelineIndex].push(event);
			indexMapping[pipelineIndex].push(index);
		});

		const clonedPlan = plan.map(pipeline => { return {
			preserveOrder: false,
			payloads: pipeline.slice(0),
		}; });

		return {
			plan: clonedPlan,
			rebuildOrder: createMapper<T>(indexMapping, plan),
		};
	}
}

function create1to1Mapper<T>() {
	return (results: Array<any[]>): any => {
		return results.map((result: T[]) => {
			if (!Array.isArray(result) || result.length !== 1){
				throw new ResultsStructureNotMatchingOriginalExecutionPlan();
			}

			return result[0];
		});
	};
}

function createMapper<T>(indexMapping: Array<number[]>, plan: Array<T[]>) {
	return (results: Array<any[]>): any[] => {
		const originalOrder: any[] = [];

		if (plan.length !== results.length){
			throw new ResultsStructureNotMatchingOriginalExecutionPlan();
		}

		plan.forEach((pipeline: T[], pipelineIndex: number) => {

			const isResultPipelineArray = Array.isArray(results[pipelineIndex]);
			const isResultSameLength = results[pipelineIndex].length === pipeline.length;

			if (!isResultPipelineArray || !isResultSameLength){
				throw new ResultsStructureNotMatchingOriginalExecutionPlan();
			}

			pipeline.forEach((item: T, itemIndex: number) => {
				const originalIndex = indexMapping[pipelineIndex][itemIndex];
				const resultValue = results[pipelineIndex][itemIndex];
				originalOrder[originalIndex] =  resultValue;
			});
		});

		return originalOrder;
	};
}

export class ResultsStructureNotMatchingOriginalExecutionPlan extends Error {
	constructor() {
		super();
		this.message = 'The results provided to decode from the scheduled execution plan doesn\'t match the original scheduled structure. Are you sure you are not deleting items or that you are passing the correct variable?';
	}
}
