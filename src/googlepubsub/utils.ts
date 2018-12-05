import {DecodedGoogleEvent} from './interfaces';

export function decodeEventstoreResponse(response: any, project: string): Array<DecodedGoogleEvent> {
	if (!response || !Array.isArray(response.entries))
		throw new UnrecognizedGoogleResponse(response);

	return response.entries.map((entry: any) => decodeEventstoreEntry(entry, project));
}

export function decodeEventstoreEntry(entry: any, project: string): DecodedGoogleEvent {
	let event: DecodedGoogleEvent;

	try {
		event = { // TODO: finish mapping & adapt isValidDecodedEventStore function
			origin: entry.event.streamId,
			data: entry.event.data,
			ackId: entry.ackId,
			project,
			eventType: entry.event.eventType,
			eventId: entry.event.eventId,
		};
	} catch (e) {
		throw new UnrecognizedGoogleEntry(entry, e);
	}

	if (!isValidDecodedEventStore(event))
		throw new UnrecognizedGoogleEntry(entry);

	return event;
}

// Cyclomatic complexity is failing. But I don't think that sppliting this in several function is good
// tslint:disable-next-line
export function isValidDecodedEventStore(event: any): event is DecodedGoogleEvent {
	return event
	&&  typeof event.origin === 'object'
	&& (typeof event.data === 'string' && !!event.data.length)
	&& (typeof event.ackId === 'string' && !!event.ackId.length)
	&& (typeof event.project === 'string' && !!event.project.length)
	&& (typeof event.eventType === 'string' && !!event.eventType.length)
	&& (typeof event.eventId === 'string' && !!event.eventId.length);
}

export class UnrecognizedGoogleResponse extends Error {
	constructor(public response: any) {
		super();
		this.message = 'The response from Google is not a recognized response. The original response is attached in the "response" attribute of this error';
	}
}

export class UnrecognizedGoogleEntry extends Error {
	constructor(public entry: any, public originalError?: any) {
		super();
		this.message = 'The entry from the response from Google is not a recognized entry. The original entry is attached in the "entry" attribute of this error. In case of exception there is an attribute "originalError".';
	}
}
