import {Pipeline} from './pipeline';
import {Dispatcher} from './dispatcher';
import {IDispatcher, IPipeline} from './interfaces';

export function pipelineFactory <T>(scheduler: IDispatcher<T>): IPipeline<T> {
	return new Pipeline(scheduler);
}
