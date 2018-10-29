import Scheduler from '@src/corebus/schedulers/parallel';
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
});

function mapPipelineExpectedValue(pipelines: any[]) {
	return pipelines.map(payloads => {
		return {
			payloads,
			preserveOrder: false,
		} as PipelinePlan<any>;
	});
}
