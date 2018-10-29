export {EventBus as Bus} from './corebus/eventBus';
export {Publisher} from './corebus/publisher';
export {Dispatcher} from './corebus/dispatchers/single';
export {default as BulkDispatcher} from './corebus/dispatchers/bulk';
export {default as ParallelScheduler} from './corebus/schedulers/parallel';
export {default as SequentialScheduler} from './corebus/schedulers/sequential';
export {pipelineFactory} from './corebus/pipeline/factory';
export {Pipeline} from './corebus/pipeline';
export {
	IMiddleware,
	IEventBus,
	EventSubscriptionCallback,
	JsonizableInterface,
	Constructable,
	ErrorLogger,
	ExecutionResult,
} from './corebus/interfaces';
export {create as createEventstoreBus, IEventFactory, IDecodedSerializedEventstoreEvent, IEventstoreEvent} from './eventstore';

// tsconfig-paths: Adds the typescript modules resulution paths attribute to the normal node require.
import tsConfig from '../tsconfig.json';
import * as tsConfigPaths from 'tsconfig-paths';

tsConfigPaths.register({
	baseUrl: './',
	paths: tsConfig.compilerOptions.paths,
});
