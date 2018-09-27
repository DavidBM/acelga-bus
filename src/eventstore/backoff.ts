import * as backoff from 'backoff';

export enum BackoffAction {
	restart,
	continue
};

export let backoffFibonacci: Backoff = (options, createInstance?: (options: backoff.ExponentialOptions) => backoff.Backoff): BackoffExecutor => {

	return (callback: BackoffCallback) => {

		const backoffStrategy = createInstance ? createInstance(options) : backoff.fibonacci(options);

		let backoffResult: BackoffAction;
		const continuing = () => backoffResult = BackoffAction.continue;
		const restarting = () => backoffResult = BackoffAction.restart;

		backoffStrategy.on('backoff', (number, delay, error) => callback(continuing, restarting, number, delay, error));

		backoffStrategy.on('ready', () => {
			if(backoffResult === BackoffAction.restart)
				backoffStrategy.reset();
			backoffStrategy.backoff();
		});

		setTimeout(() => backoffStrategy.backoff(), 0);

		return () => backoffStrategy.reset();
	};
}

export type BackoffCallback = (continuing: () => void, restarting: () => void, number: number, delay: number, error?: any) => void;

export type BackoffExecutor = (callback: BackoffCallback) => BackoffStopper;

export type BackoffStopper = () => void;

export type Backoff = (options: backoff.ExponentialOptions, createInstance?: (options: backoff.ExponentialOptions) => backoff.Backoff) => BackoffExecutor;
