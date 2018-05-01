import {Bus} from '../index';
/**
Design:
- Class for pulling fron the http server
- Factory class for recreating the Events
- Event base type that blocks the "name" property and forces to have a serializer class
- Middleware that creates the event and blocks the execution
**/
class EventStoreBusConnector<T = {}> {
	
	bus: Bus<T> = new Bus();
	publisher = this.bus.createPublisher();
	receiver = this.bus.createReceiver();
	connectionOpstions: {};
	lastProcessedMessage: string;

	constructor(connectionOpstions: {}, lastProcessedMessage: string) {
		this.connectionOpstions = connectionOpstions;
		this.lastProcessedMessage = lastProcessedMessage;
	}
}
