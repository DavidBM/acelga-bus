import {
	isValidDecodedEventStore,
	decodeEventstoreEntry,
	UnrecognizedEventstoreEntry,
	decodeEventstoreResponse,
	UnrecognizedEventstoreResponse,
	eventstoreFeedbackHTTP,
} from '../../eventstore/utils';
import {eventstoreResponse, wrongEntries} from './utils';
import {eventBuilder, eventBuilderWithDefaults} from '../corebus/utils';
import {createServer} from 'http';

describe('eventstore Utils',  () => {
	describe('isValidDecodedEventStore', () => {
		it('should return true if it is a valid event store event', () => {
			const event = eventBuilderWithDefaults('test');
			expect(isValidDecodedEventStore(event)).toBeTruthy();
		});

		it('should return false if any parameter is not valid', () => {
			const nonValidArguments = [undefined, 0, null, NaN, ''];
			const validArguments: [string, string, any, string, any, any, any] = ['evetType', 'stream', {}, 'uuid', {}, 'urlA', 'urlB'];

			validArguments.forEach((_, index) => {
				if (index === 4 || index === 2) return; // We don't check metadata & data

				const eventArgs: [string, string, any, string, any, any, any] = Array.from(validArguments) as any;

				nonValidArguments.forEach(arg => {

					eventArgs[index] = arg as any;
					const event = eventBuilder.apply(null, eventArgs);
					expect(isValidDecodedEventStore(event)).toBeFalsy();
				});
			});
		});
	});

	describe('decodeEventstoreEntry', () => {
		it('should decode correctly the entries from Eventstore', () => {
			expect(decodeEventstoreEntry(eventstoreResponse.entries[0])).toEqual(
				eventBuilder(
					eventstoreResponse.entries[0].event.eventType,
					eventstoreResponse.entries[0].event.streamId,
					eventstoreResponse.entries[0].event.data,
					eventstoreResponse.entries[0].event.eventId,
					eventstoreResponse.entries[0].event.metaData,
					eventstoreResponse.entries[0].event.links[2].uri,
					eventstoreResponse.entries[0].event.links[3].uri,
				),
			);
		});

		it('should launch an error in case that entries are not valid', () => {
			wrongEntries.entries.forEach(wrongEntry => {
				expect(() => decodeEventstoreEntry(wrongEntry)).toThrowError(UnrecognizedEventstoreEntry);
			});
		});
	});

	describe('decodeEventstoreResponse', () => {
		it('should decode correctly the entries from Eventstore', () => {
			expect(decodeEventstoreResponse(eventstoreResponse)).toEqual([
				eventBuilder(
					eventstoreResponse.entries[0].event.eventType,
					eventstoreResponse.entries[0].event.streamId,
					eventstoreResponse.entries[0].event.data,
					eventstoreResponse.entries[0].event.eventId,
					eventstoreResponse.entries[0].event.metaData,
					eventstoreResponse.entries[0].event.links[2].uri,
					eventstoreResponse.entries[0].event.links[3].uri,
				),
				eventBuilder(
					eventstoreResponse.entries[1].event.eventType,
					eventstoreResponse.entries[1].event.streamId,
					eventstoreResponse.entries[1].event.data,
					eventstoreResponse.entries[1].event.eventId,
					eventstoreResponse.entries[1].event.metaData,
					eventstoreResponse.entries[1].event.links[2].uri,
					eventstoreResponse.entries[1].event.links[3].uri,
				),
			]);
		});

		it('should launch an error in case that entries are not valid', () => {
			expect(() => decodeEventstoreResponse(wrongEntries)).toThrowError(UnrecognizedEventstoreEntry);
			expect(() => decodeEventstoreResponse(null)).toThrowError(UnrecognizedEventstoreResponse);
		});
	});

	describe('eventstoreFeedbackHTTP', () => {
		it('call the endpoint with got', (done) => {
			const PORT = 61029;

			const server = createServer((request, response) => {
			    response.writeHead(200, {'Content-Type': 'text/plain'});
			    response.write('Hello world');
			    response.end();
			    expect(request.url).toBe('/hola');
			});

			server.listen(PORT, (error: any) => {
				eventstoreFeedbackHTTP(`http://localhost:${PORT}/hola`)
				.then((data) => {
					expect(data).toBeUndefined();
					server.close();
					done();
				}).catch(() => {
					server.close();
					done.fail();
				});
			});

			setTimeout(() => server.close(), 5000);
		});
	});
});
