import {ErrorLogger} from '../../index';
import {PullBasicClient, DecodedEvent, EventProcessingLogic} from '../../../src/corebus/interfaces';
import {BackoffExecutor} from '../../../src/corebus/backoff';
import {IEmptyTracker} from '../../../src/corebus/emptyTracker';

import {PullBasicClientMock} from './mocks/pullBasicClient';
import {EventProcessorMock} from './mocks/eventProcessor';
import {createSpiedBackoff} from '../mocks/spiedBackoff';
import {EmptyTracker} from '../../../src/corebus/emptyTracker';

import {SynchronousClientProcessor, TooLongToStop} from '../../../src/corebus/synchronousClientProcessor';

describe('SynchronousClientProcessor', () => {
	let client: PullBasicClient<any>;
	let eventProcessor: EventProcessingLogic<any, any>;
	let logError: ErrorLogger;
	let backoffStrategy: BackoffExecutor;
	let eventstoreResponseDecoder: (response: any) => Array<DecodedEvent<any>>;
	let tracker: IEmptyTracker;
	let synchronousClientProcessor: SynchronousClientProcessor<any, any, any>;

	beforeEach(() => {
		client = new PullBasicClientMock([{}]);
		eventProcessor = new EventProcessorMock();
		logError = jest.fn().mockImplementation(() => Promise.resolve());
		const {backoff} = createSpiedBackoff(1, 10);
		backoffStrategy = backoff;
		eventstoreResponseDecoder = (response: any) => response;
		tracker = new EmptyTracker();

		synchronousClientProcessor = new SynchronousClientProcessor(client, (e: any[]) => eventProcessor.processEvents(e), logError, backoffStrategy, eventstoreResponseDecoder, [{}], tracker, 20);
	});

	it('should log "TooLongToStop" error if it takes more than the timeout', async (done) => {
		jest.spyOn(eventProcessor, 'processEvents').mockImplementation(() => new Promise(() => {}));

		synchronousClientProcessor.startConsumption();

		await synchronousClientProcessor.stop();

		expect(logError).toHaveBeenCalledWith(new TooLongToStop());
		expect(logError).toHaveBeenCalledTimes(1);

		done();
	});

	it('should log a general errro if there is an error in getEvents from the PullBasicClient', async (done) => {
		jest.spyOn(client, 'getEvents').mockImplementation(() => { throw new Error('HOLA'); });

		synchronousClientProcessor.startConsumption();

		await synchronousClientProcessor.stop();

		expect(logError).toHaveBeenCalledWith(new Error('HOLA'));
		expect(logError).toHaveBeenCalledTimes(1);

		done();
	});
});
