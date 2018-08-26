import {isPromise} from '@src/corebus/utils';

describe('utils', () => {
	describe('isPromise', () => {
		it('should return true if it is a promise', () => {
			const result = isPromise(Promise.resolve());
			expect(result).toBe(true);
		});

		it('should return false if it a thenable', () => {
			const result = isPromise({then: () => {}});
			expect(result).toBe(false);
		});

		it('should return false if it not a promise', () => {
			[].forEach(value => {
				const result = isPromise(false);
				expect(result).toBe(false);
			});
		});
	});
});
