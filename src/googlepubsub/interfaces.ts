import {TypedEvent} from '../corebus/interfaces';

export interface IGoogleEvent{
	origin: string; // Events needs to be routed to a stream called with the name
}

export type OriginalType = IGoogleEvent & TypedEvent & {
	data: any;
	eventId: string;
	ackId: string;
	project: string;
};

export type DecodedSerializedGoogleEvent = IGoogleEvent & OriginalType;

export type GoogleAcknowledger = {
	ack: (project: string, subscription: string, ids: string[]) => Promise<void>,
	nack: (project: string, subscription: string, ids: string[]) => Promise<void>,
};
