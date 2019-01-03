import {GoogleClient} from '../../simplegooglepubsub/client';

describe('Googlepubsub client', () => {

	let pullClient: any;
	let pushClient: any;

	beforeEach(() => {
		pullClient = {
			subscriptionPath: () => {},
			pull: () => Promise.resolve(),
			acknowledge: () => Promise.resolve(),
			modifyAckDeadline: () => Promise.resolve(),
		};

		pushClient = {
			topicPath: () => {},
			publish: () => Promise.resolve(),
		};

	});

	it('call correctly the publish method from the Google client', () => {
		const client = new GoogleClient<any>('test', 'keyFile.src', pullClient, pushClient);

		const generatedPath = 'HolaPepito';
		const eventOrigin = 'EventA';
		const event = {origin: eventOrigin};

		const topicPathSpy = jest.spyOn(pushClient, 'topicPath').mockImplementation(() => generatedPath);
		const publishSpy = jest.spyOn(pushClient, 'publish');

		client.publish(event);

		expect(topicPathSpy).toHaveBeenCalledTimes(1);
		expect(topicPathSpy).toHaveBeenCalledWith('test', eventOrigin);
		expect(publishSpy).toHaveBeenCalledTimes(1);
		expect(publishSpy).toHaveBeenCalledWith({topic: generatedPath, messages: [{data: Buffer.from(JSON.stringify(event))}]});
	});

	it('call correctly the pull method from the Google client', async () => {
		const client = new GoogleClient<any>('test', 'keyFile.src', pullClient, pushClient);

		const generatedPath = 'HolaPepito';
		const eventOrigin = 'EventA';

		const subscriptionPathSpy = jest.spyOn(pullClient, 'subscriptionPath').mockImplementation(() => generatedPath);
		const pullSpy = jest.spyOn(pullClient, 'pull').mockImplementation(() => ['hola']);

		const result = await client.getEvents({subscriptionName: eventOrigin} as any);

		expect(result).toEqual(['hola']);
		expect(subscriptionPathSpy).toHaveBeenCalledTimes(1);
		expect(subscriptionPathSpy).toHaveBeenCalledWith('test', eventOrigin);
		expect(pullSpy).toHaveBeenCalledTimes(1);
		expect(pullSpy).toHaveBeenCalledWith({subscription: generatedPath, maxMessages: 100});
	});

	it('call correctly the acknowledge method from the Google client', () => {
		const client = new GoogleClient<any>('test', 'keyFile.src', pullClient, pushClient);

		const generatedPath = 'HolaPepito';
		const eventOrigin = 'EventA';
		const event = {subscription: eventOrigin, ackId: 23};

		const subscriptionPathSpy = jest.spyOn(pullClient, 'subscriptionPath').mockImplementation(() => generatedPath);
		const ackSpy = jest.spyOn(pullClient, 'acknowledge');

		client.ack(event as any);

		expect(subscriptionPathSpy).toHaveBeenCalledTimes(1);
		expect(subscriptionPathSpy).toHaveBeenCalledWith('test', eventOrigin);
		expect(ackSpy).toHaveBeenCalledTimes(1);
		expect(ackSpy).toHaveBeenCalledWith({subscription: generatedPath, ackIds: [event.ackId]});
	});

	it('call correctly the modifyAckDeadline method from the Google client', () => {
		const client = new GoogleClient<any>('test', 'keyFile.src', pullClient, pushClient);

		const generatedPath = 'HolaPepito';
		const eventOrigin = 'EventA';
		const event = {subscription: eventOrigin, ackId: 23};

		const subscriptionPathSpy = jest.spyOn(pullClient, 'subscriptionPath').mockImplementation(() => generatedPath);
		const ackSpy = jest.spyOn(pullClient, 'modifyAckDeadline');

		client.nack(event as any);

		expect(subscriptionPathSpy).toHaveBeenCalledTimes(1);
		expect(subscriptionPathSpy).toHaveBeenCalledWith('test', eventOrigin);
		expect(ackSpy).toHaveBeenCalledTimes(1);
		expect(ackSpy).toHaveBeenCalledWith({subscription: generatedPath, ackIds: [event.ackId], ackDeadlineSeconds: 0});
	});
});
