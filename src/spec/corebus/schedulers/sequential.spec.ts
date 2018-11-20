import Scheduler from '../../../corebus/schedulers/sequential';
import {PipelinePlan} from '../../../corebus/interfaces';

describe('AllParallelScheduler', () => {
	let scheduler: Scheduler<any>;

	beforeEach(() => {
		scheduler = new Scheduler(true);
	});

	it('should return all in only one pipeline', () => {
		const events = new Array(100).fill(0).map((_, index) => index);

		const plan = scheduler.schedule(events);

		expect(plan.plan).toEqual(mapPipelineExpectedValue([events], true));
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
