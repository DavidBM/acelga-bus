import {originalEventSymbol} from '../../eventstore/interfaces';

export function eventBuilder(
	eventType: string,
	aggregate: string,
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
		aggregate,
	};
}

export function eventBuilderWithDefaults(
	eventType: string,
	aggregate: string = 'test',
	data: any = {},
	eventId: string = 'randon',
	metadata: any = '',
	ack: any = 'invalidUrlForAck',
	nack: any = 'invalidUrlForNAck',
	) {

	return eventBuilder(eventType, aggregate, data, eventId, metadata, ack, nack);
}

export const eventstoreResponse = {
	entries: [{
		event: {
			eventId: '84741430-1430-1430-1430-153684741430',
			eventType: 'EventA',
			eventNumber: 1,
			data: {
				hola: ':D:',
			},
			metaData: '{}',
			streamId: 'test',
			isJson: true,
			isMetaData: true,
			isLinkMetaData: false,
			positionEventNumber: 1,
			positionStreamId: 'test',
			title: '1@test',
			id: 'http://localhost:2113/streams/test/1',
			updated: '2018-09-13T14:03:35.091912Z',
			author: {
				name: 'EventStore',
			},
			summary: 'test',
			links: [{
				uri: 'https://localhost:2113/streams/test/1',
				relation: 'edit',
			}, {
				uri: 'http://localhost:2113/streams/test/1',
				relation: 'alternate',
			}, {
				uri: 'http://localhost:2113/subscriptions/test/test-subs/ack/84741430-1430-1430-1430-153684741430',
				relation: 'ack',
			}, {
				uri: 'http://localhost:2113/subscriptions/test/test-subs/nack/84741430-1430-1430-1430-153684741430',
				relation: 'nack',
			}],
		},
	}, {
		event: {
			eventId: '84739125-9125-9125-9125-153684739125',
			eventType: 'EventB',
			eventNumber: 0,
			data: {
				hola: ':D:',
			},
			metaData: '{}',
			streamId: 'test',
			isJson: true,
			isMetaData: true,
			isLinkMetaData: false,
			positionEventNumber: 0,
			positionStreamId: 'test',
			title: '0@test',
			id: 'http://localhost:2113/streams/test/0',
			updated: '2018-09-13T14:03:34.296854Z',
			author: {
				name: 'EventStore',
			},
			summary: 'test',
			links: [{
				uri: 'https://localhost:2113/streams/test/0',
				relation: 'edit',
			}, {
				uri: 'http://localhost:2113/streams/test/0',
				relation: 'alternate',
			}, {
				uri: 'http://localhost:2113/subscriptions/test/test-subs/ack/84739125-9125-9125-9125-153684739125',
				relation: 'ack',
			}, {
				uri: 'http://localhost:2113/subscriptions/test/test-subs/nack/84739125-9125-9125-9125-153684739125',
				relation: 'nack',
			}],
		},
	}],
};

export const wrongEntries = {
	entries: [{
		event: {
			eventId: '84741430-1430-1430-1430-153684741430',
			eventType: '',
			eventNumber: 1,
			data: {
				hola: ':D:',
			},
			metaData: '{}',
			streamId: 'test',
			isJson: true,
			isMetaData: true,
			isLinkMetaData: false,
			positionEventNumber: 1,
			positionStreamId: 'test',
			title: '1@test',
			id: 'http://localhost:2113/streams/test/1',
			updated: '2018-09-13T14:03:35.091912Z',
			author: {
				name: 'EventStore',
			},
			summary: 'test',
			links: [{
				uri: 'https://localhost:2113/streams/test/1',
				relation: 'edit',
			}, {
				uri: 'http://localhost:2113/streams/test/1',
				relation: 'alternate',
			}, {
				uri: 'http://localhost:2113/subscriptions/test/test-subs/ack/84741430-1430-1430-1430-153684741430',
				relation: 'ack',
			}, {
				uri: 'http://localhost:2113/subscriptions/test/test-subs/nack/84741430-1430-1430-1430-153684741430',
				relation: 'nack',
			}],
		},
	}, {
		event: {
			eventId: '84741430-1430-1430-1430-153684741430',
			eventType: 'test',
			eventNumber: 1,
			data: {
				hola: ':D:',
			},
			metaData: '{}',
			streamId: 'test',
			isJson: true,
			isMetaData: true,
			isLinkMetaData: false,
			positionEventNumber: 1,
			positionStreamId: 'test',
			title: '1@test',
			id: 'http://localhost:2113/streams/test/1',
			updated: '2018-09-13T14:03:35.091912Z',
			author: {
				name: 'EventStore',
			},
			summary: 'test',
			links: [{
				uri: 'https://localhost:2113/streams/test/1',
				relation: 'edit',
			}, {
				uri: 'http://localhost:2113/streams/test/1',
				relation: 'alternate',
			}, {
				uri: 'http://localhost:2113/subscriptions/test/test-subs/ack/84741430-1430-1430-1430-153684741430',
				relation: 'ack',
			}, {
				uri: '',
				relation: 'nack',
			}],
		},
	}, {
		event: {
			eventId: '84741430-1430-1430-1430-153684741430',
			eventType: 'test',
			eventNumber: 1,
			data: {
				hola: ':D:',
			},
			metaData: '{}',
			streamId: '',
			isJson: true,
			isMetaData: true,
			isLinkMetaData: false,
			positionEventNumber: 1,
			positionStreamId: 'test',
			title: '1@test',
			id: 'http://localhost:2113/streams/test/1',
			updated: '2018-09-13T14:03:35.091912Z',
			author: {
				name: 'EventStore',
			},
			summary: 'test',
			links: [{
				uri: 'https://localhost:2113/streams/test/1',
				relation: 'edit',
			}, {
				uri: 'http://localhost:2113/streams/test/1',
				relation: 'alternate',
			}, {
				uri: 'http://localhost:2113/subscriptions/test/test-subs/ack/84741430-1430-1430-1430-153684741430',
				relation: 'ack',
			}, {
				uri: 'http://localhost:2113/subscriptions/test/test-subs/nack/84741430-1430-1430-1430-153684741430',
				relation: 'nack',
			}],
		},
	}, {
		event: {
			eventId: '',
			eventType: 'test',
			eventNumber: 1,
			data: {
				hola: ':D:',
			},
			metaData: '{}',
			streamId: 'test',
			isJson: true,
			isMetaData: true,
			isLinkMetaData: false,
			positionEventNumber: 1,
			positionStreamId: 'test',
			title: '1@test',
			id: 'http://localhost:2113/streams/test/1',
			updated: '2018-09-13T14:03:35.091912Z',
			author: {
				name: 'EventStore',
			},
			summary: 'test',
			links: [{
				uri: 'https://localhost:2113/streams/test/1',
				relation: 'edit',
			}, {
				uri: 'http://localhost:2113/streams/test/1',
				relation: 'alternate',
			}, {
				uri: 'http://localhost:2113/subscriptions/test/test-subs/ack/84741430-1430-1430-1430-153684741430',
				relation: 'ack',
			}, {
				uri: 'http://localhost:2113/subscriptions/test/test-subs/nack/84741430-1430-1430-1430-153684741430',
				relation: 'nack',
			}],
		},
	}, {
		event: {
			eventId: '84741430-1430-1430-1430-153684741430',
			eventType: 'test',
			eventNumber: 1,
			data: {
				hola: ':D:',
			},
			metaData: '{}',
			streamId: 'test',
			isJson: true,
			isMetaData: true,
			isLinkMetaData: false,
			positionEventNumber: 1,
			positionStreamId: 'test',
			title: '1@test',
			id: 'http://localhost:2113/streams/test/1',
			updated: '2018-09-13T14:03:35.091912Z',
			author: {
				name: 'EventStore',
			},
			summary: 'test',
			links: [{
				uri: 'https://localhost:2113/streams/test/1',
				relation: 'edit',
			}, {
				uri: 'http://localhost:2113/streams/test/1',
				relation: 'alternate',
			}, {
				uri: 'http://localhost:2113/subscriptions/test/test-subs/ack/84741430-1430-1430-1430-153684741430',
				relation: 'ack',
			}, {
				uri: '',
				relation: 'nack',
			}],
		},
	}, {
		event: null,
	}, {
	}],
};
