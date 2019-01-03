import {DecodedGoogleEvent, SubscriptionConfig, GoogleMessage} from './interfaces';

export function decodeEventstoreResponse(response: any, config: SubscriptionConfig): Array<DecodedGoogleEvent> {
	if (!response || !Array.isArray(response.receivedMessages))
		throw new UnrecognizedGoogleResponse(response);

	return response.receivedMessages.map((entry: any) => decodeEventstoreEntry(entry, config));
}

export function decodeEventstoreEntry(entry: GoogleMessage, subscriptionConfig: SubscriptionConfig): DecodedGoogleEvent {
	let event: DecodedGoogleEvent;

	try {
		event = {
			eventType: 'Google',
			data: Buffer.from(entry.message.data, 'base64').toString(),
			ackId: entry.ackId,
			project: subscriptionConfig.projectName,
			eventId: entry.message.messageId,
			subscription: subscriptionConfig.subscriptionName,
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
	&& (typeof event.subscription === 'string' && !!event.data.length)
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

/* Example of response
{
  "receivedMessages": [
    {
      "ackId": "QV5AEkw2BURJUytDCypYEU4EISE-MD5FU0RQBhYsXUZIUTcZCGhRDk9eIz81IChFEwtTE1Fcdg5BEGkzXHUHUQ0YdHpoIT8LFwNURVl-VVsJPGh-Y3QOVg8Zc3Voc2hbEgkCRXvwlZLpxtVLZhg9XBJLLD5-PTBF",
      "message": {
        "data": "eyJob2xhIjogdHJ1ZX0=", // Base64, decoded: {"hola": true}
        "attributes": {
          "some": "other"
        },
        "messageId": "197201896211800",
        "publishTime": "2018-12-11T15:37:14.844Z"
      }
    }
  ]
}
*/
