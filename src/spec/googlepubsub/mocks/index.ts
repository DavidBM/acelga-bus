import * as BackoffOriginall from 'backoff';
import {backoffFibonacci, BackoffCallback, BackoffExecutor, Backoff, BackoffAction} from '../../../corebus/backoff';
import {HTTPClient} from 'geteventstore-promise';
import {eventstoreResponse} from '../utils';
import {SubscriptionDefinition, GoogleClient} from '../../../googlepubsub/client';
import {EmptyTracker} from '../../../corebus/emptyTracker';
import {EventstoreFeedbackHTTP} from '../../../googlepubsub/interfaces';
import {decodeEventstoreResponse} from '../../../googlepubsub/utils';
import {pipelineFactory} from '../../../corebus/pipeline/factory';
import {Dispatcher} from '../../../corebus/dispatchers/single';
import {IDispatcher, IPipeline} from '../../../corebus/interfaces';

export function createSpiedBackoff(initialDelay: number = 1, maxDelay: number = 10) {
	const summary = {
		resetCalls: 0,
		backoffCalls: 0,
	};

	const backoff = backoffFibonacci({
		randomisationFactor: 0,
		initialDelay,
		maxDelay,
	}, (options) => {
		const back = BackoffOriginall.fibonacci(options);

		const originalOn = back.on;
		const originalReset = back.reset;
		const originalBackoff = back.backoff;

		// jest.spyOn(back, 'on').mockImplementation(() => {originalOn.call(back);});
		jest.spyOn(back, 'reset').mockImplementation(() => {
			summary.resetCalls++;
			originalReset.call(back);
		});
		jest.spyOn(back, 'backoff').mockImplementation(() => {
			summary.backoffCalls++;
			originalBackoff.call(back);
		});

		return back;
	});

	return {backoff, summary};
}

export function createMockedSpiedEventstorelibWithNoEvents() {
	const client = new HTTPClient({hostname: 'localhost', port: 2113, credentials: {username: 'admin', password: 'changeit'}});

	jest.spyOn(client.persistentSubscriptions, 'getEvents').mockImplementation(() => Promise.resolve({entries: []}));
	jest.spyOn(client, 'writeEvent').mockImplementation(() => Promise.resolve());
	jest.spyOn(client, 'ping').mockImplementation(() => Promise.resolve());

	return client;
}

export function createMockedSpiedEventstorelibWithCorrectEvents(times: number = 1, eventsToReturn: any = eventstoreResponse) {
	const client = new HTTPClient({hostname: 'localhost', port: 2113, credentials: {username: 'admin', password: 'changeit'}});
	let counter = 0;

	jest.spyOn(client.persistentSubscriptions, 'getEvents').mockImplementation(() => {
		if (counter >= times) return Promise.resolve({entries: []});
		counter++;
		return Promise.resolve(eventsToReturn);
	});

	jest.spyOn(client, 'writeEvent').mockImplementation(() => Promise.resolve());
	jest.spyOn(client, 'ping').mockImplementation(() => Promise.resolve());

	return client;
}

export function createSpiedMockedEventstoreClient(correctEventsIterations: number, subscritions: Array<SubscriptionDefinition> = [], eventsToReturn?: any, evDecoder: any = decodeEventstoreResponse) {

	const {backoff, summary} = createSpiedBackoff(1, 10);
	const client = createMockedSpiedEventstorelibWithCorrectEvents(correctEventsIterations, eventsToReturn);
	const errorLogger = jest.fn();
	const eventstoreSignal: EventstoreFeedbackHTTP = jest.fn().mockImplementation(() => Promise.resolve());
	const tracker = new EmptyTracker();
	const esClient = new GoogleClient(client, eventstoreSignal, errorLogger, backoff, evDecoder, subscritions, tracker, 25000);

	jest.spyOn(esClient, 'nack');
	jest.spyOn(esClient, 'ack');

	return {
		client: esClient,
		backoffSummary: summary,
		backoff,
		errorLogger,
		evClient: client,
		eventstoreSignal,
	};
}

export function createBrokenPipelineFactory<T>() {
	return (dispatcher: IDispatcher<T>): IPipeline<T> => {
		const pipeline = pipelineFactory<T>(dispatcher);

		jest.spyOn(pipeline, 'executeContinueOnError').mockImplementation(() => { throw new Error('One Randon Error'); });
		jest.spyOn(pipeline, 'executeStopOnError').mockImplementation(() => { throw new Error('Other Randon Error'); });

		return pipeline;
	};
}

export function noACKDecodedEventstoreResponse(response: any) {
	const decodedResponse = generateNormalDecodedEventStoreResponse(response);

	decodedResponse.forEach((item: any) => item.ack = '');

	return decodedResponse;
}

export function noNACKDecodedEventstoreResponse(response: any) {
	const decodedResponse = generateNormalDecodedEventStoreResponse(response);

	decodedResponse.forEach((item: any) => item.nack = '');

	return decodedResponse;
}

function generateNormalDecodedEventStoreResponse(response: any) {
	const decodedResponse = {
		aggregate: 'aggregate',
		data: {},
		metadata: {},
		ack: 'http://localhost:2113/subscriptions/test/test-subs/ack/84741430-1430-1430-1430-153684741430',
		nack: 'http://localhost:2113/subscriptions/test/test-subs/nack/84741430-1430-1430-1430-153684741430',
		eventType: 'EventA',
		eventId: '84741430-1430-1430-1430-153684741430',
	};

	if (response && Array.isArray(response.entries)){
		return response.entries.map(() => Object.assign({}, decodedResponse));
	}

	return [decodedResponse];
}
