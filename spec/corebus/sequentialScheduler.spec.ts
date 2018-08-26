import Scheduler from '@src/corebus/sequentialScheduller';
import {PipelinePlan} from '@src/corebus/interfaces';

describe('AllParallelScheduler', () => {
	let scheduler: Scheduler<any>;

	beforeEach(() => {
		scheduler = new Scheduler(true);
	});

	it('should return all in parallel if max concurrency is fasable', () => {
		const events = new Array(100).fill(0).map((_, index) => index);

		const plan = scheduler.schedule(events);

		expect(plan.plan).toEqual(mapPipelineExpectedValue([events], true));
	});

	it('should return all in parallel if max concurrency is fasable', () => {
		const events = new Array(100).fill(0).map((_, index) => index);
		const expectedResult = new Array(100).fill(0).map((_, index) => index);

		const plan = scheduler.schedule(events);

		expect(events).toEqual(plan.rebuildOrder([expectedResult]));
	});
});

function mapPipelineExpectedValue(pipelines: any[], preserveOrder: boolean) {
	return pipelines.map(payloads => {
		return {
			payloads,
			preserveOrder,
		} as PipelinePlan<any>;
	});
}
