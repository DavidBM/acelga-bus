import {IMiddleware} from '../../index';

export enum Operation {
	Add,
	Multiply,
	Divide,
	Substract,
	Void,
}

/* tslint:disable-next-line:cyclomatic-complexity */
export const OperationMiddleware: (number: number, operation: Operation) => IMiddleware<number> = (number: number, operation: Operation) => (event: number) => {
	switch (operation) {
		case Operation.Add:
			return Promise.resolve(event + number);
		case Operation.Multiply:
			return Promise.resolve(event * number);
		case Operation.Divide:
			return Promise.resolve(event / number);
		case Operation.Substract:
			return Promise.resolve(event - number);
		case Operation.Void:
			// This one will stop the execution. No events will be dispatched and no more middlewares will be called.
			return Promise.resolve();
		default:
			return Promise.resolve(event);
	}
};

export class CustomEventNumber {
	data: number;
	constructor(data: number = 0) {
		this.data = data;
	}
}

/* tslint:disable-next-line:cyclomatic-complexity */
export const CustomEventOperationMiddleware: (number: number, operation: Operation) => IMiddleware<CustomEventNumber> = (number, operation) => (event) => {
	switch (operation) {
		case Operation.Add:
			return Promise.resolve(new CustomEventNumber(event.data + number));
		case Operation.Multiply:
			return Promise.resolve(new CustomEventNumber(event.data * number));
		case Operation.Divide:
			return Promise.resolve(new CustomEventNumber(event.data / number));
		case Operation.Substract:
			return Promise.resolve(new CustomEventNumber(event.data - number));
		case Operation.Void:
			// This one will stop the execution. No events will be dispatched and no more middlewares will be called.
			return Promise.resolve();
		default:
			return Promise.resolve(new CustomEventNumber(event.data));
	}
};

export class EmptyEvent {}

export function eventBuilder(
	eventType: string,
	origin: string,
	data: any,
	eventId: string,
	metadata: any,
	ack: any,
	nack: any,
	) {

	return {
		data,
		metadata,
		ack,
		nack,
		eventType,
		eventId,
		origin,
	};
}

export function eventBuilderWithDefaults(
	eventType: string,
	origin: string = 'test',
	data: any = {},
	eventId: string = 'randon',
	metadata: any = '',
	ack: any = 'invalidUrlForAck',
	nack: any = 'invalidUrlForNAck',
	) {

	return eventBuilder(eventType, origin, data, eventId, metadata, ack, nack);
}
