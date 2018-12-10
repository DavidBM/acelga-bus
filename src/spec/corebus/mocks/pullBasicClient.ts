import {PullBasicClient} from '../../../../src/corebus/interfaces';

export class PullBasicClientMock implements PullBasicClient<any> {
	constructor(protected events: any) { }

	getEvents(config: any): Promise<any> {
		return Promise.resolve(this.events);
	}
}
