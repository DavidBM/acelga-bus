import {Bus, Event} from '@src/index'; 

describe('Bus', () => {
	var bus: Bus;

	beforeAll(() => {
		bus = new Bus();
	});

	it("should exist", () => {
		expect(bus instanceof Bus).toBeTruthy();
	})

	it("should send and receive messages", (done) => {
		var event = new Event();

		bus.on(Event, (e) => {
			expect(e).toEqual(event);
			done();
		});

		bus.publish(event);
	});

	it("should send and receive messages to the correct destination", (done) => {
		var event = new Event();
		class Event2 extends Event {};
		var event2 = new Event2;

		bus.on(Event, (e) => {
			expect(e).toEqual(event);
			done();
		});

		bus.publish(event);
		bus.publish(event2);
	});
});