import {EventProcessor/*, EventWithoutOriginalEvent, InternalErrorNOACKAll*/, ErrorOnEventReconstruction} from '../../../src/corebus/eventProcessor';
import {originalEventSymbol} from '../../../src/corebus/interfaces';

import {AcknowledgeableClientMock} from './mocks/acknowledgeableClient';
import {BulkDispatcher} from './mocks/bulkDispatcher';

class EventA {}

function buildEventProcessor(recreateEvent: (e: unknown) => any) {
		const acknowledgeableClient = new AcknowledgeableClientMock();
		const errorLogger = jest.fn();
		const bulkDispatcher = new BulkDispatcher();
		const eventProcessor = new EventProcessor(recreateEvent, errorLogger, bulkDispatcher as any, acknowledgeableClient);

		return {acknowledgeableClient, errorLogger, bulkDispatcher, eventProcessor};
}

describe('EventProcessor', () => {

	it('Should decode the event with the factory', async (done) => {
		const factory = {build: (e: any) => new EventA()};
		const recreateEvent = jest.fn().mockImplementation((event: any) => factory.build(event));

		const {bulkDispatcher, eventProcessor} = buildEventProcessor(recreateEvent);

		const decodedEvent = {eventType: 'EventA'};
		const receivedEvent = new EventA();
		(receivedEvent as any)[originalEventSymbol] = decodedEvent;

		jest.spyOn(bulkDispatcher, 'trigger');

		await eventProcessor.processEvents([decodedEvent]);

		expect(recreateEvent).toHaveBeenCalledTimes(1);
		expect(recreateEvent).toHaveBeenCalledWith(decodedEvent);
		expect(bulkDispatcher.trigger).toHaveBeenCalledTimes(1);
		expect(bulkDispatcher.trigger).toHaveBeenCalledWith([receivedEvent]);

		done();
	});

	it('Should log errors if a factory throw', async () => {
		const factory = {build: (e: any) => { throw new Error('Error'); } };
		const recreateEvent = jest.fn().mockImplementation((event: any) => factory.build(event));

		const {eventProcessor, errorLogger} = buildEventProcessor(recreateEvent);

		const originalEvent = {eventType: 'EventA'};

		await eventProcessor.processEvents([originalEvent]);

		expect(errorLogger).toHaveBeenLastCalledWith(new ErrorOnEventReconstruction(originalEvent, new Error('Error')));
	});
});
