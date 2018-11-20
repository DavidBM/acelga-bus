import {debugLogger} from '../../corebus/logger';

describe('Bus', () => {
	it('should call the function with the same arguments', () => {
		const loggerFn = jest.fn();

		const logger = debugLogger(loggerFn as any);

		logger(1, 2, 3);

		expect(loggerFn.mock.calls[0]).toEqual([1, 2, 3]);
	});

	it('should not call the function if not arguments are provided', () => {
		const loggerFn = jest.fn();

		const logger = debugLogger(loggerFn as any);

		logger();

		expect(loggerFn.mock.calls.length).toBe(0);
	});
});
