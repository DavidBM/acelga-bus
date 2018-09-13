import {IDecodedSerializedEventstoreEvent} from './interfaces';

export function decodeEventstoreResponse(response: any): Array<IDecodedSerializedEventstoreEvent> {
	if (!response || !Array.isArray(response.entries))
		throw new UnrecognizedEventstoreResponse(response);

	const events = response.entries.map((entry: any) => decodeEventstoreEntries(entry));

	return [];
}

export function decodeEventstoreEntries(entry: any): IDecodedSerializedEventstoreEvent {
	let event: IDecodedSerializedEventstoreEvent;

	try {
		event = {
			data: entry.event.data,
			metadata: entry.event.metadata,
			ack: entry.event.links.find((link: any) => link.relation = 'ack'),
			nack: entry.event.links.find((link: any) => link.relation = 'nack'),
			eventType: entry.event.eventType,
			eventId: entry.event.eventId,
			aggregate: entry.event.streamId,
		};

	} catch (e) {
		throw new UnrecognizedEventstoreEntry(entry);
	}

	if (isValidDecodedEventStore(event))
		throw new UnrecognizedEventstoreEntry(entry);

	return event;
}

// Cyclomatic complexity is failing. But honestly I don't think that sppliting this in several function is good
// tslint:disable-next-line
function isValidDecodedEventStore(event: any) {
	return typeof event.data !== 'object'
	|| !event.metadata
	|| typeof event.ack !== 'string'
	|| typeof event.nack !== 'string'
	|| typeof event.eventType !== 'string'
	|| typeof event.eventId !== 'string'
	|| typeof event.aggregate !== 'string';
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

	constructor(entry: any) {
		super();
		this.entry = entry;
		this.message = 'The entry from the response from event store is not a recognized entry. The original entry is attached in the "entry" attribute of this error';
	}
}
