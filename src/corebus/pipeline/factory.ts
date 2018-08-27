import {Pipeline} from './index';
import {Dispatcher} from '@src/corebus/dispatchers/single';
import {IDispatcher, IPipeline} from '@src/corebus/interfaces';

export function pipelineFactory <T>(scheduler: IDispatcher<T>): IPipeline<T> {
	return new Pipeline(scheduler);
}
