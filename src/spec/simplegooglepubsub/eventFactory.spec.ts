import {GoogleEventFactory, Google} from '../../simplegooglepubsub/eventFactory';

describe('EventFactory', () => {
	it('should create an instance of Google class',  () => {
		const factory = new GoogleEventFactory();

		const instance = factory.build('Hola' as any);

		expect(instance).toBeInstanceOf(Google);
		expect(instance.data).toBe('Hola');
	});
});
