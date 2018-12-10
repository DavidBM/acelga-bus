import {Event, DecodedEvent, ReceivedEvent} from '../corebus/interfaces';

export type SubscriptionConfig = {
	topic: string,
};

export type EventInstanceContract = {
	origin: string;
};

export type GoogleDecodedContract = {
	origin: string;
	data: any;
	eventId: string;
	ackId: string;
	project: string;
};

export type GoogleEvent = Event<EventInstanceContract>;

export type DecodedGoogleEvent = DecodedEvent<GoogleDecodedContract>;

export type ReceivedGoogleEvent = ReceivedEvent<EventInstanceContract, GoogleDecodedContract>;

export type GoogleAcknowledger = {
	ack: (project: string, subscription: string, ids: string[]) => Promise<void>,
	nack: (project: string, subscription: string, ids: string[]) => Promise<void>,
};

export type GoogleMessage = {
	message: {
		data: string,
	},
};

export type GoogleFormatedSubscription = string;
export type GoogleMessageAckId = string;

export interface HTTPGoogleSynchronousSubscriptionClient {
	subscriptionPath: (projectName: string, subscriptionName: string) => GoogleFormatedSubscription;
	pull: (request: {subscription: GoogleFormatedSubscription, maxMessages: number}) => Promise<{receivedMessages: GoogleMessage[]}>;
	acknowledge: (ackRequest: {subscription: GoogleFormatedSubscription, ackIds: GoogleMessageAckId[]}) => Promise<void>;
	modifyAckDeadline: (modifyAckRequest: {subscription: GoogleFormatedSubscription, ackIds: GoogleMessageAckId[], ackDeadlineSeconds: number}) => Promise<void>;
}

export type GoogleFormatedTopic = string;

export enum GoogleRetryIdempotent {
	ABORTED = 'ABORTED',
	CANCELLED = 'CANCELLED',
	DEADLINE_EXCEEDED = 'DEADLINE_EXCEEDED',
	INTERNAL = 'INTERNAL',
	RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
	UNAVAILABLE = 'UNAVAILABLE',
	UNKNOWN = 'UNKNOWN',
}

export interface HTTPGoogleSynchronousPublisherClient {
	topicPath: () => GoogleFormatedTopic;
	publish: (
		request: {
			topic: GoogleFormatedTopic,
			messages: Array<{data: Buffer}>,
		},
		config?: {
			retry: {
				backoffSettings: {
					initialRetryDelayMillis: number, // 100
					retryDelayMultiplier: number, // 1.2
					maxRetryDelayMillis: number, // 1000
					initialRpcTimeoutMillis: number, // 2000
					rpcTimeoutMultiplier: number, // 1.5
					maxRpcTimeoutMillis: number, // 30000
					totalTimeoutMillis: number, // 45000
				},
			},
		},
	) => Promise<{messageIds: string[]}>;
}
