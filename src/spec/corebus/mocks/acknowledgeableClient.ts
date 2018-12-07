import {AcknowledgeableClient, DecodedEvent} from '../../../../src/corebus/interfaces';

export class AcknowledgeableClientMock implements AcknowledgeableClient<any> {
	ack(event: DecodedEvent<any>): Promise<void> {
		return Promise.resolve();
	}
	nack(event: DecodedEvent<any>): Promise<void> {
		return Promise.resolve();
	}
}
