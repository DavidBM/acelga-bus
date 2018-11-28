import {EventFactoryRespository, EventNameCollision, FactoryNotFoundError, NotADecodedSerializedEventstoreEvent} from '../../corebus/eventFactoryRepository';
import {IEventstoreEvent} from '../../eventstore/interfaces';
import {isValidDecodedEventStore} from '../../eventstore/utils';
import {eventBuilderWithDefaults} from './utils';

const EventA = 'EventA';
const EventB = 'EventB';
const EventC = 'EventC';
class FactoryA { build(a: any) { return a; } }
class FactoryB { build(a: any) { return a; } }
class FactoryC { build(a: any) { return a; } }

describe('factoryRepository', () => {
	let repository: EventFactoryRespository<any, any>;

	beforeEach(() => {
		repository = new EventFactoryRespository(isValidDecodedEventStore);
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

		repository.execute(eventBuilderWithDefaults(EventB));

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

		expect(() => repository.execute(eventBuilderWithDefaults(EventB))).toThrowError(FactoryNotFoundError);

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

		expect(() => repository.execute({eventType: ''} as any)).toThrowError(NotADecodedSerializedEventstoreEvent);

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

		const event = eventBuilderWithDefaults(EventB, 1 as any);

		expect(() => repository.execute(event)).toThrowError(NotADecodedSerializedEventstoreEvent);

		expect(factoryB.build).toHaveBeenCalledTimes(0);
		expect(factoryA.build).toHaveBeenCalledTimes(0);
		expect(factoryC.build).toHaveBeenCalledTimes(0);
	});
});
