import {EventProcessor/*, EventWithoutOriginalEvent, InternalErrorNOACKAll*/, ErrorOnEventReconstruction} from '../../../src/corebus/eventProcessor';
import {ErrorLogger, EventFactoryRespository} from '../../index';
import {AcknowledgeableClient, ReceivedEvent, originalEventSymbol} from '../../../src/corebus/interfaces';

import {AcknowledgeableClientMock} from './mocks/acknowledgeableClient';
import {BulkDispatcher} from './mocks/bulkDispatcher';

class EventA {}

describe('EventProcessor', () => {
	let eventProcessor: EventProcessor<any, any>;
	let eventRepository: EventFactoryRespository<any, any>;
	let errorLogger: ErrorLogger;
	let bulkDispatcher: BulkDispatcher<any>;
	let acknowledgeableClient: AcknowledgeableClient<any>;

	beforeEach(() => {
		acknowledgeableClient = new AcknowledgeableClientMock();
		errorLogger = jest.fn();
		eventRepository = new EventFactoryRespository((arg: any): arg is ReceivedEvent<any, any> => true);
		bulkDispatcher = new BulkDispatcher();
		eventProcessor = new EventProcessor(eventRepository, errorLogger, bulkDispatcher as any, acknowledgeableClient);
	});

	it('should add the correct factory for the event processing when the event reaches', () => {
		const factory = {build: (e: any) => new EventA()};
		jest.spyOn(eventRepository, 'set');

		eventProcessor.addEventType(EventA, factory);

		expect(eventRepository.set).toHaveBeenLastCalledWith('EventA', factory);
		expect(eventRepository.set).toHaveBeenCalledTimes(1);
	});

	it('Should decode the event with the factory', async (done) => {
		const factory = {build: (e: any) => new EventA()};

		const decodedEvent = {eventType: 'EventA'};
		const receivedEvent = new EventA();
		(receivedEvent as any)[originalEventSymbol] = decodedEvent;

		jest.spyOn(eventRepository, 'execute');
		jest.spyOn(bulkDispatcher, 'trigger');

		eventProcessor.addEventType(EventA, factory);

		await eventProcessor.processEvents([decodedEvent]);

		expect(eventRepository.execute).toHaveBeenCalledTimes(1);
		expect(bulkDispatcher.trigger).toHaveBeenCalledTimes(1);
		expect(bulkDispatcher.trigger).toHaveBeenCalledWith([receivedEvent]);

		done();
	});

	it('Should log errors if a factory throw', async () => {
		const factory = {build: (e: any) => { throw new Error('Error'); } };
		jest.spyOn(eventRepository, 'set');

		eventProcessor.addEventType(EventA, factory);

		const originalEvent = {eventType: 'EventA'};

		await eventProcessor.processEvents([originalEvent]);

		expect(errorLogger).toHaveBeenLastCalledWith(new ErrorOnEventReconstruction(originalEvent, new Error('Error')));
	});
});
