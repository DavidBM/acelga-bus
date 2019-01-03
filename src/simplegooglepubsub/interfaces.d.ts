import {DecodedEvent, ReceivedEvent} from '../corebus/interfaces';

export interface SubscriptionConfig {
	subscriptionName: string;
	projectName: string;
	topicName: string;
}

export interface EventInstanceContract {
	origin: string;
}

export interface GoogleDecodedContract {
	data: any;
	ackId: string;
	project: string;
	eventId: string;
	subscription: string;
}

export interface GoogleEvent extends EventInstanceContract{}

export interface DecodedGoogleEvent extends DecodedEvent<GoogleDecodedContract> {}

export interface ReceivedGoogleEvent extends ReceivedEvent<EventInstanceContract, GoogleDecodedContract> {}

export type GoogleMessage = {
	ackId: string,
	message: {
		data: string,
		messageId: string,
	},
	attributes: Array<{[key: string]: any}>,
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
	topicPath: (projectId: string, topicName: string) => GoogleFormatedTopic;
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
