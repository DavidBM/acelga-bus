import {DecodedSerializedEventstoreEvent, originalEventSymbol, EventstoreFeedbackHTTP} from './interfaces';
import * as got from 'got';

export function decodeEventstoreResponse(response: any): Array<DecodedSerializedEventstoreEvent> {
	if (!response || !Array.isArray(response.entries))
		throw new UnrecognizedEventstoreResponse(response);

	return response.entries.map((entry: any) => decodeEventstoreEntry(entry));
}

export function decodeEventstoreEntry(entry: any): DecodedSerializedEventstoreEvent {
	let event: DecodedSerializedEventstoreEvent;

	try {
		event = {
			origin: entry.event.streamId,
			data: entry.event.data,
			metadata: entry.event.metaData,
			ack: entry.event.links.find((link: any) => link.relation === 'ack').uri,
			nack: entry.event.links.find((link: any) => link.relation === 'nack').uri,
			eventType: entry.event.eventType,
			eventId: entry.event.eventId,
		};

	} catch (e) {
		throw new UnrecognizedEventstoreEntry(entry, e);
	}

	if (!isValidDecodedEventStore(event))
		throw new UnrecognizedEventstoreEntry(entry);

	return event;
}

// Cyclomatic complexity is failing. But I don't think that sppliting this in several function is good
// tslint:disable-next-line
export function isValidDecodedEventStore(event: any): event is DecodedSerializedEventstoreEvent {
	return event
	&& typeof event.data === 'object'
	&& (typeof event.ack === 'string' && !!event.ack.length)
	&& (typeof event.nack === 'string' && !!event.nack.length)
	&& (typeof event.eventType === 'string' && !!event.eventType.length)
	&& (typeof event.eventId === 'string' && !!event.eventId.length)
	&& (typeof event.origin === 'string' && !!event.origin.length);
}

export class UnrecognizedEventstoreResponse extends Error {
	response: any;

	constructor(response: any) {
		super();
		this.response = response;
		this.message = 'The response from event store is not a recognized response. The original response is attached in the "response" attribute of this error';
	}
}

export class UnrecognizedEventstoreEntry extends Error {
	entry: any;
	originalError: any;

	constructor(entry: any, originalError?: any) {
		super();
		this.entry = entry;
		this.originalError = originalError;
		this.message = 'The entry from the response from event store is not a recognized entry. The original entry is attached in the "entry" attribute of this error. In case of exception there is an attribute "originalError".';
	}
}

export let eventstoreFeedbackHTTP: EventstoreFeedbackHTTP = (url: string): Promise<void> => {
	return got.post(url).then(() => {});
};
