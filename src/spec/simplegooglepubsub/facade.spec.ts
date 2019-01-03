import {GoogleFacade} from '../../simplegooglepubsub/facade';

describe('Googlepubsub client', () => {

	let client: any;
	let publisher: any;
	let dispatcher: any;

	beforeEach(() => {
		client = {
			startConsumption: () => {},
			stop: () => Promise.resolve(),
		};

		publisher = {
			publish: () => Promise.resolve(),
		};

		dispatcher = {
			onAny: () => Promise.resolve(),
			on: () => Promise.resolve(),
		};

	});

	it('should not start the consumption until the "start consultion" call is made', async () => {
		jest.spyOn(client, 'startConsumption');

		const facade = new GoogleFacade(client, publisher, dispatcher);

		await Promise.resolve();

		expect(client.startConsumption).not.toHaveBeenCalled();

		facade.startConsumption();

		await Promise.resolve();

		expect(client.startConsumption).toHaveBeenCalledTimes(1);
	});

	it('should stop the subscription when "stop is called"', async () => {
		jest.spyOn(client, 'stop');

		const facade = new GoogleFacade(client, publisher, dispatcher);

		await Promise.resolve();

		expect(client.stop).not.toHaveBeenCalled();

		facade.stop();

		await Promise.resolve();

		expect(client.stop).toHaveBeenCalledTimes(1);
	});

	it('should subscrine the callback always with onAny', () => {
		jest.spyOn(dispatcher, 'onAny');
		jest.spyOn(dispatcher, 'on');

		const facade = new GoogleFacade(client, publisher, dispatcher);

		facade.onAny(() => {});

		expect(dispatcher.onAny).toHaveBeenCalledTimes(1);
		expect(dispatcher.on).not.toHaveBeenCalled();
	});

	it('should subscrine the callback always with onAny', () => {
		jest.spyOn(dispatcher, 'onAny');
		jest.spyOn(dispatcher, 'on');

		const facade = new GoogleFacade(client, publisher, dispatcher);

		facade.on(class A {} as any, () => {});

		expect(dispatcher.onAny).toHaveBeenCalledTimes(1);
		expect(dispatcher.on).not.toHaveBeenCalled();
	});

	it('should accept only one subscription', () => {
		jest.spyOn(dispatcher, 'onAny');
		jest.spyOn(dispatcher, 'on');

		const facade = new GoogleFacade(client, publisher, dispatcher);

		facade.on(class A {} as any, () => {});
		facade.on(class A {} as any, () => {});
		facade.onAny(() => {});
		facade.onAny(() => {});
		facade.on(class A {} as any, () => {});
		facade.onAny(() => {});

		expect(dispatcher.onAny).toHaveBeenCalledTimes(1);
		expect(dispatcher.on).not.toHaveBeenCalled();
	});

	it('should publish any event', () => {
		jest.spyOn(publisher, 'publish');

		const facade = new GoogleFacade(client, publisher, dispatcher);

		facade.publish('event' as any);

		expect(publisher.publish).toHaveBeenCalledTimes(1);
		expect(publisher.publish).toHaveBeenCalledWith('event');
	});
});
