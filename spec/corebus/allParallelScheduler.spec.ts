import Scheduler from '@src/corebus/allParallelScheduler';
import {ResultsStructureNotMatchingOriginalExecutionPlan} from '@src/corebus/allParallelScheduler';
import {PipelinePlan} from '@src/corebus/interfaces';

describe('AllParallelScheduler', () => {
	let scheduler: Scheduler<any>;

	beforeEach(() => {
		scheduler = new Scheduler();
	});

	it('should return all in parallel if max concurrency is fasable', () => {
		const events = new Array(100).fill(0).map((_, index) => index);

		[undefined, null, NaN, 0, false, ''].forEach((value => {
			const plan = scheduler.schedule(events, value as any);
			expect(plan.plan).toEqual(mapPipelineExpectedValue(events.map(item => [item])));
		}));
	});

	it('should return all in parallel if maxConcurrency is greater or the same as the number of events', () => {
		const events = new Array(100).fill(0).map((_, index) => index);

		[100, 101, 20000, 1023401240234, Infinity, -1, -Infinity].forEach((value => {
			const plan = scheduler.schedule(events, value as any);
			expect(plan.plan).toEqual(mapPipelineExpectedValue(events.map(item => [item])));
		}));
	});

	it('should return all in parallel if maxConcurrency negative', () => {
		const events = new Array(100).fill(0).map((_, index) => index);

		[-100, -50, -254785, -1, -Infinity].forEach((value => {
			const plan = scheduler.schedule(events, value as any);
			expect(plan.plan).toEqual(mapPipelineExpectedValue(events.map(item => [item])));
		}));
	});

	it('should correctly order all items (normal case)', () => {
		const events = new Array(5).fill(0).map((_, index) => index);

		const plan = scheduler.schedule(events, 3);
		expect(plan.plan).toEqual(mapPipelineExpectedValue([
			[events[0], events[3]],
			[events[1], events[4]],
			[events[2]],
		]));
	});

	it('should correctly order all items (bigger case)', () => {
		const events = new Array(12).fill(0).map((_, index) => index);

		const plan = scheduler.schedule(events, 3);
		expect(plan.plan).toEqual(mapPipelineExpectedValue([
			[events[0], events[3], events[6], events[9]],
			[events[1], events[4], events[7], events[10]],
			[events[2], events[5], events[8], events[11]],
		]));
	});

	it('should reorder correctly the items after the execution (case events > concurrency)', () => {
		const events = new Array(12).fill(0).map((_, index) => index);

		const plan = scheduler.schedule(events, 3);

		const originalArray = plan.rebuildOrder([
			[0, 3, 6, 9],
			[1, 4, 7, 10],
			[2, 5, 8, 11],
		]);

		expect(originalArray).toEqual(events);
		expect(originalArray.length).toBe(events.length);
	});

	it('should reorder correctly the items after the execution (case events = concurrency)', () => {
		const events = new Array(12).fill(0).map((_, index) => index);

		const plan = scheduler.schedule(events, 12);

		const originalArray = plan.rebuildOrder([
			[0], [1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11],
		]);

		expect(originalArray).toEqual(events);
		expect(originalArray.length).toBe(events.length);
	});

	it('should reorder correctly the items after the execution (case events < concurrency)', () => {
		const events = new Array(7).fill(0).map((_, index) => index);

		const plan = scheduler.schedule(events, 12);

		const originalArray = plan.rebuildOrder([
			[0], [1], [2], [3], [4], [5], [6],
		]);

		expect(originalArray).toEqual(events);
		expect(originalArray.length).toBe(events.length);
	});

	it('should throw an error if the structure doesn\'t match (case missing value)', () => {
		const events = new Array(15).fill(0).map((_, index) => index);

		const plan = scheduler.schedule(events, 3);

		const wrongStructureResult = [
			[0, 3, 6, 9, 12],
			[1, 4, 7, 10, 13],
			[2, 5,    11, 14],
		];

		expect(() => plan.rebuildOrder(wrongStructureResult)).toThrowError(ResultsStructureNotMatchingOriginalExecutionPlan);
	});

	it('should throw an error if the structure doesn\'t match (case missing pipeline)', () => {
		const events = new Array(15).fill(0).map((_, index) => index);

		const plan = scheduler.schedule(events, 3);

		const wrongStructureResult = [
			[0, 3, 6, 9, 12],

			[2, 5, 8, 11, 14],
		];

		expect(() => plan.rebuildOrder(wrongStructureResult as any)).toThrowError(ResultsStructureNotMatchingOriginalExecutionPlan);
	});

	it('should throw an error if the structure doesn\'t match (case too many values)', () => {
		const events = new Array(15).fill(0).map((_, index) => index);

		const plan = scheduler.schedule(events, 3);

		const wrongStructureResult = [
			[0, 3, 6, 9, 12],
			[1, 4, 7, 10, 13, 14],
			[2, 5, 8, 11, 14],
		];

		expect(() => plan.rebuildOrder(wrongStructureResult as any)).toThrowError(ResultsStructureNotMatchingOriginalExecutionPlan);
	});

	it('should throw an error if the structure doesn\'t match (case too many pipelines)', () => {
		const events = new Array(15).fill(0).map((_, index) => index);

		const plan = scheduler.schedule(events, 3);

		const wrongStructureResult = [
			[0, 3, 6, 9, 12],
			[1, 4, 7, 10, 13],
			[2, 5, 8, 11, 14],
			[],
		];

		expect(() => plan.rebuildOrder(wrongStructureResult as any)).toThrowError(ResultsStructureNotMatchingOriginalExecutionPlan);
	});

	it('should throw an error if the structure doesn\'t match (case too many pipelines & events < concurrency)', () => {
		const events = new Array(7).fill(0).map((_, index) => index);

		const plan = scheduler.schedule(events, 15);

		const wrongStructureResult = [
			[0, 3, 6, 9, 12],
			[1, 4, 7, 10, 13],
			[2, 5, 8, 11, 14],
			[],
		];

		expect(() => plan.rebuildOrder(wrongStructureResult as any)).toThrowError(ResultsStructureNotMatchingOriginalExecutionPlan);
	});

	it('should not fail if the user mutates the plan object', () => {
		const events = new Array(15).fill(0).map((_, index) => index);

		const plan = scheduler.schedule(events, 3);

		delete plan.plan[2];
		plan.plan[0].payloads = plan.plan[1].payloads.slice(1, 3);

		const correctStructureResult = [
			[0, 3, 6, 9, 12],
			[1, 4, 7, 10, 13],
			[2, 5, 8, 11, 14],
		];

		expect(() => plan.rebuildOrder(correctStructureResult)).not.toThrow();
	});
});

function mapPipelineExpectedValue(pipelines: any[]) {
	return pipelines.map(payloads => {
		return {
			payloads,
			preserveOrder: false,
		} as PipelinePlan<any>;
	});
}
