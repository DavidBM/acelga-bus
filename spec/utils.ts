import {IMiddleware} from '@src/index'; 
import {IEvent} from '@src/index';

export enum Operation {
	Add,
	Multiply,
	Divide,
	Substract,
	Void
};

export const OperationMiddleware = (number: number, operation: Operation) => (event: number) => {
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
			//This one will stop the execution. No events will be dispatched and no more middlewares will be called. 
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
			//This one will stop the execution. No events will be dispatched and no more middlewares will be called. 
			return Promise.resolve();
		default:
			return Promise.resolve(new CustomEventNumber(event.data));
	}
}

export class EmptyEvent implements IEvent {};