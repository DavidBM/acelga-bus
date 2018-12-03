import {Pipeline} from './index';
import {IDispatcher, IPipeline} from '../interfaces';

export function pipelineFactory <T>(scheduler: IDispatcher<T>): IPipeline<T> {
	return new Pipeline(scheduler);
}
