import * as backoff from 'backoff';

export enum BackoffAction {
	restart,
	continue
};

export let backoffFibonacci: Backoff = (options, createInstance?: (options: backoff.ExponentialOptions) => backoff.Backoff): BackoffExecutor => {

	return (callback: BackoffCallback) => {

		const backoffStrategy = createInstance ? createInstance(options) : backoff.fibonacci(options);

		let backoffResult: BackoffAction | null = null;
		const continuing = () => {
			backoffResult = BackoffAction.continue;
			setTimeout(computebackoff, 0);
		};
		const restarting = () => {
			backoffResult = BackoffAction.restart;
			setTimeout(computebackoff, 0);
		};

		let isReady = false;

		backoffStrategy.on('backoff', (number, delay, error) => {
			backoffResult = null;
			isReady = false;
			callback(continuing, restarting, number, delay, error);
		});

		backoffStrategy.on('ready', () => {
			isReady = true;
			setTimeout(computebackoff, 0);
		});

		const computebackoff = () => {
			if(!isReady) return;
			if(backoffResult === BackoffAction.restart)
				backoffStrategy.reset();
			if(backoffResult !== null)
				backoffStrategy.backoff();
		}

		setTimeout(() => backoffStrategy.backoff(), 0);

		return () => backoffStrategy.reset();
	};
}

export type BackoffCallback = (continuing: () => void, restarting: () => void, number: number, delay: number, error?: any) => void;

export type BackoffExecutor = (callback: BackoffCallback) => BackoffStopper;

export type BackoffStopper = () => void;

export type Backoff = (options: backoff.ExponentialOptions, createInstance?: (options: backoff.ExponentialOptions) => backoff.Backoff) => BackoffExecutor;
