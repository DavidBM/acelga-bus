import {Bus} from '../index';
import {EventStoreConnectionOptions} from './interfaces';

import {eventstore} from 'geteventstore-promise';
import * as backoff from 'backoff';
/*
 Missing things here:
 - The injection and ussage (in proccessEvents()) of factories
 - The Refactor for extracting pattern
 - To not accept an event type without factory
 - Think in how to raise error of "NoEventFactoryFound"
 	- Add a default factory?
 - Remove any! Maybe creating my own interface for it?
 - TESTS
 - Actually USE THE BUS! All this code should be a middleware
*/
class EventStoreBusConnector<T = {}> {

	bus: Bus<T> = new Bus();
	publisher = this.bus.createPublisher();
	receiver = this.bus.createReceiver();
	connectionOptions: EventStoreConnectionOptions;
	lastProcessedMessage: string;

	client: any;
	streamName: string;

	constructor(connectionOptions: EventStoreConnectionOptions, streamName: string, lastProcessedMessage: string) {
		this.connectionOptions = connectionOptions;
		this.lastProcessedMessage = lastProcessedMessage;
		this.streamName = streamName;

		this.client = this.connect(this.connectionOptions);

		const backoffStrategy = createBackoff();

		this.startConsume(backoffStrategy, this.lastProcessedMessage);
	}

	protected connect(options: EventStoreConnectionOptions): any {
		return eventstore.http({
			hostname: this.connectionOptions.hostname,
			port: this.connectionOptions.port,
			credentials: {
				username: this.connectionOptions.credentials.username,
				password: this.connectionOptions.credentials.password,
			},
		});
	}

	protected startConsume(backoffStrategy: backoff.Backoff, startPosition: string): void {
		backoffStrategy.on('backoff', (number, delay) => {
			this.client.getEvents(this.streamName, startPosition, 100)
			.then((events: []) => {
				if (events.length === 0) {
					return backoffStrategy.backoff();
				}

				this.processEvents(events)
				.then(() => {
					this.startConsume(backoffStrategy, startPosition);
				})
				.catch((error: any) => {
					return backoffStrategy.backoff(error);
				});
			})
			.catch((error: any) => {
				return backoffStrategy.backoff(error);
			});
		});

		backoffStrategy.on('fail', (error: any) => {});
	}

	protected processEvents(events: []): Promise<void> {
		return Promise.resolve();
	}
}

function createBackoff(): backoff.Backoff {
	return backoff.fibonacci({
		randomisationFactor: 0,
		initialDelay: 300,
		maxDelay: 7000,
	});
}
