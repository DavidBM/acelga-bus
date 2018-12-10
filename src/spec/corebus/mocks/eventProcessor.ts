import {EventProcessingLogic} from '../../../../src/corebus/interfaces';

export class EventProcessorMock implements EventProcessingLogic<any, any> {
	public addEventType(event: any, factory: any): void {
		return;
	}

	public async processEvents(events: any[]): Promise<void> {
		return Promise.resolve();
	}
}
