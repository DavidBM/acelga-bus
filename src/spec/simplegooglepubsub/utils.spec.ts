import {decodeEventstoreResponse, UnrecognizedGoogleResponse, UnrecognizedGoogleEntry} from '../../simplegooglepubsub/utils';

const VALID_CONFIG = {
	subscriptionName: 'my_subscription',
	projectName: 'my_project',
	topicName: 'my_topic,',
};

const EMPTY_VALID_RESPONSE = {
	receivedMessages: [],
};

const WRONG_EMPTY_RESPONSE = {};
const WRONG_EMPTY_RESPONSE_NULL = { receivedMessages: null };
const WRONG_EMPTY_RESPONSE_UNDEFINED = { receivedMessages: null };
const WRONG_EMPTY_RESPONSE_STRING = { receivedMessages: 'string' };
const WRONG_EMPTY_RESPONSE_REGEXP = { receivedMessages: /a/ };
const WRONG_EMPTY_RESPONSE_NAN = { receivedMessages: NaN };

const CREATE_VALID_RESPONSE = () => ({
  receivedMessages: [
    {
      ackId: 'QV5AEkw2BURJUytDCypYEU4EISE-MD5FU0RQBhYsXUZIUTcZCGhRDk9eIz81IChFEwtTE1Fcdg5BEGkzXHUHUQ0YdHpoIT8LFwNURVl-VVsJPGh-Y3QOVg8Zc3Voc2hbEgkCRXvwlZLpxtVLZhg9XBJLLD5-PTBF',
      message: {
        data: 'eyJob2xhIjogdHJ1ZX0=', // Base64, decoded: {"hola": true}
        attributes: {
          some: 'other',
        },
        messageId: '197201896211800',
        publishTime: '2018-12-11T15:37:14.844Z',
      },
    },
  ],
});

describe('Google pub sub Utils', () => {

	describe('decodeEventstoreResponse', () => {
		it('should thrown an exception when the response is not correct', () => {
			expect(() => decodeEventstoreResponse(EMPTY_VALID_RESPONSE, VALID_CONFIG)).not.toThrowError();
			expect(() => decodeEventstoreResponse('non_an_array' as any, VALID_CONFIG)).toThrowError(UnrecognizedGoogleResponse);
			expect(() => decodeEventstoreResponse(null as any, VALID_CONFIG)).toThrowError(UnrecognizedGoogleResponse);
			expect(() => decodeEventstoreResponse(undefined as any, VALID_CONFIG)).toThrowError(UnrecognizedGoogleResponse);
			expect(() => decodeEventstoreResponse(WRONG_EMPTY_RESPONSE as any, VALID_CONFIG)).toThrowError(UnrecognizedGoogleResponse);
			expect(() => decodeEventstoreResponse(WRONG_EMPTY_RESPONSE_NULL as any, VALID_CONFIG)).toThrowError(UnrecognizedGoogleResponse);
			expect(() => decodeEventstoreResponse(WRONG_EMPTY_RESPONSE_UNDEFINED as any, VALID_CONFIG)).toThrowError(UnrecognizedGoogleResponse);
			expect(() => decodeEventstoreResponse(WRONG_EMPTY_RESPONSE_STRING as any, VALID_CONFIG)).toThrowError(UnrecognizedGoogleResponse);
			expect(() => decodeEventstoreResponse(WRONG_EMPTY_RESPONSE_REGEXP as any, VALID_CONFIG)).toThrowError(UnrecognizedGoogleResponse);
			expect(() => decodeEventstoreResponse(WRONG_EMPTY_RESPONSE_NAN as any, VALID_CONFIG)).toThrowError(UnrecognizedGoogleResponse);
		});

		it('should return the correct response', () => {
			const validResponse = CREATE_VALID_RESPONSE();

			const response = decodeEventstoreResponse(validResponse, VALID_CONFIG);

			expect(response).toEqual([{
				eventType: 'Google',
				data: '{"hola": true}',
				ackId: validResponse.receivedMessages[0].ackId,
				project: VALID_CONFIG.projectName,
				eventId: validResponse.receivedMessages[0].message.messageId,
				subscription: VALID_CONFIG.subscriptionName,
			}]);
		});

		it('should return the correct response', () => {
			const validResponse = CREATE_VALID_RESPONSE();

			validResponse.receivedMessages[0].message.data = '';

			expect(() => decodeEventstoreResponse(validResponse, VALID_CONFIG)).toThrowError(UnrecognizedGoogleEntry);
		});

		it('should return the correct response', () => {
			const validResponse = CREATE_VALID_RESPONSE();

			validResponse.receivedMessages[0].message.data = null as any;

			expect(() => decodeEventstoreResponse(validResponse, VALID_CONFIG)).toThrowError(UnrecognizedGoogleEntry);
		});

		it('should return the correct response', () => {
			const validResponse = CREATE_VALID_RESPONSE();

			validResponse.receivedMessages[0].message.data = undefined as any;

			expect(() => decodeEventstoreResponse(validResponse, VALID_CONFIG)).toThrowError(UnrecognizedGoogleEntry);
		});

		it('should return the correct response', () => {
			const validResponse = CREATE_VALID_RESPONSE();

			delete validResponse.receivedMessages[0].message.data;

			expect(() => decodeEventstoreResponse(validResponse, VALID_CONFIG)).toThrowError(UnrecognizedGoogleEntry);
		});
	});
});
