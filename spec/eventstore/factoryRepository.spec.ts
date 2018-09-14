import {EventFactoryRespository, EventNameCollision, FactoryNotFoundError, NotADecodedSerializedEventstoreEvent} from '@src/eventstore/factoryRepository';
import {IEventstoreEvent} from '@src/eventstore/interfaces';

const EventA = 'EventA';
const EventB = 'EventB';
const EventC = 'EventC';
class FactoryA { build(a: any) { return a; } }
class FactoryB { build(a: any) { return a; } }
class FactoryC { build(a: any) { return a; } }

describe('factoryRepository', () => {
	let repository: EventFactoryRespository<IEventstoreEvent>;

	beforeEach(() => {
		repository = new EventFactoryRespository();
	});

	it('should store and return the correct factory', () => {
		repository.set(EventA, new FactoryA());
		repository.set(EventB, new FactoryB());
		repository.set(EventC, new FactoryC());

		expect(repository.get(EventB)).toBeInstanceOf(FactoryB);
		expect(repository.get(EventA)).toBeInstanceOf(FactoryA);
		expect(repository.get(EventC)).toBeInstanceOf(FactoryC);
	});

	it('should throw if two factories are added to the same event', () => {
		repository.set(EventA, new FactoryA());
		expect(() => repository.set(EventA, new FactoryB())).toThrowError(EventNameCollision);
		expect(() => repository.set(EventA, new FactoryA())).toThrowError(EventNameCollision);
	});

	it('should execute the correct factory', () => {
		const factoryA = new FactoryA();
		const factoryB = new FactoryB();
		const factoryC = new FactoryC();
		jest.spyOn(factoryA, 'build');
		jest.spyOn(factoryB, 'build');
		jest.spyOn(factoryC, 'build');

		repository.set(EventA, factoryA);
		repository.set(EventB, factoryB);
		repository.set(EventC, factoryC);

		repository.execute(eventBuilder(EventB));

		expect(factoryB.build).toHaveBeenCalledTimes(1);
		expect(factoryA.build).toHaveBeenCalledTimes(0);
		expect(factoryC.build).toHaveBeenCalledTimes(0);
	});

	it('should throw if not factory is found', () => {
		const factoryA = new FactoryA();
		const factoryB = new FactoryB();
		const factoryC = new FactoryC();
		jest.spyOn(factoryA, 'build');
		jest.spyOn(factoryB, 'build');
		jest.spyOn(factoryC, 'build');

		repository.set(EventA, factoryA);
		// repository.set(EventB, factoryB);
		repository.set(EventC, factoryC);

		expect(() => repository.execute(eventBuilder(EventB))).toThrowError(FactoryNotFoundError);

		expect(factoryB.build).toHaveBeenCalledTimes(0);
		expect(factoryA.build).toHaveBeenCalledTimes(0);
		expect(factoryC.build).toHaveBeenCalledTimes(0);
	});

	it('should throw an invalid event is provided', () => {
		const factoryA = new FactoryA();
		const factoryB = new FactoryB();
		const factoryC = new FactoryC();
		jest.spyOn(factoryA, 'build');
		jest.spyOn(factoryB, 'build');
		jest.spyOn(factoryC, 'build');

		repository.set(EventA, factoryA);
		repository.set(EventB, factoryB);
		repository.set(EventC, factoryC);

		expect(() => repository.execute({eventTypo: ''} as any)).toThrowError(NotADecodedSerializedEventstoreEvent);

		expect(factoryB.build).toHaveBeenCalledTimes(0);
		expect(factoryA.build).toHaveBeenCalledTimes(0);
		expect(factoryC.build).toHaveBeenCalledTimes(0);
	});

	it('should throw if the event has the correct attributes but wrong values', () => {
		const factoryA = new FactoryA();
		const factoryB = new FactoryB();
		const factoryC = new FactoryC();
		jest.spyOn(factoryA, 'build');
		jest.spyOn(factoryB, 'build');
		jest.spyOn(factoryC, 'build');

		repository.set(EventA, factoryA);
		repository.set(EventB, factoryB);
		repository.set(EventC, factoryC);

		const event = eventBuilder(EventB, 1 as any);

		expect(() => repository.execute(event)).toThrowError(NotADecodedSerializedEventstoreEvent);

		expect(factoryB.build).toHaveBeenCalledTimes(0);
		expect(factoryA.build).toHaveBeenCalledTimes(0);
		expect(factoryC.build).toHaveBeenCalledTimes(0);
	});
});

function eventBuilder(
	eventType: string,
	aggregate: string = 'test',
	data: any = {},
	eventId: string = 'randon',
	metadata: any = '',
	ack: any = 'invalidUrlForAck',
	nack: any = 'invalidUrlForNAck',
	) {

	return {
		data,
		metadata,
		ack,
		nack,
		eventType,
		eventId,
		aggregate,
	};
}
