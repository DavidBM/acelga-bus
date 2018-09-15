import {isValidDecodedEventStore, decodeEventstoreEntry, UnrecognizedEventstoreEntry, decodeEventstoreResponse, UnrecognizedEventstoreResponse} from '@src/eventstore/eventstoreUtils';
import {eventBuilder, eventBuilderWithDefaults, eventstoreResponse, wrongEntries} from './utils';

describe('eventstore Utils',  () => {
	describe('isValidDecodedEventStore', () => {
		it('should return true if it is a valid event store event', () => {
			const event = eventBuilderWithDefaults('test');
			expect(isValidDecodedEventStore(event)).toBeTruthy();
		});

		it('should return false if any parameter is not valid', () => {
			const nonValidArguments = [undefined, 0, null, NaN, ''];
			const validArguments = ['evetType', 'stream', {}, 'uuid', {}, 'urlA', 'urlB'];

			validArguments.forEach((_, index) => {
				if (index === 4 || index === 2) return; // We don't check metadata & data

				const eventArgs = Array.from(validArguments);

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
});
