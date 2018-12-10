import * as backoff from 'backoff';

export enum BackoffAction {
	restart,
	continue,
}

type BackoffFactory = (options: backoff.ExponentialOptions) => backoff.Backoff;

export class BackoffWrapper {
	backoffStrategy: backoff.Backoff;
	backoffResult: BackoffAction | null = null;
	isReady: boolean = false;
	callback: BackoffCallback;

	constructor(callback: BackoffCallback, options: backoff.ExponentialOptions, factory?: BackoffFactory) {
		this.callback = callback;
		this.backoffStrategy = getBackoffInstance(options, factory);
		this.backoffStrategy.on('backoff', (number: number, delay: number, error?: any) => this.onBackoff(number, delay, error));
		this.backoffStrategy.on('ready', () => this.onReady());

		this.backoffStrategy.backoff();
	}

	onBackoff(number: number, delay: number, error?: any) {
		this.backoffResult = null;
		this.isReady = false;
		this.callback(() => this.continuing(), () => this.restarting(), number, delay, error);
	}

	onReady() {
		this.isReady = true;
		setTimeout(() => this.computebackoff(), 0);
	}

	continuing() {
		this.backoffResult = BackoffAction.continue;
		setTimeout(() => this.computebackoff(), 0);
	}

	restarting() {
		this.backoffResult = BackoffAction.restart;
		setTimeout(() => this.computebackoff(), 0);
	}

	computebackoff() {
		// If it is not ready, then it will be schedules when continuing/restarting are called
		if (!this.isReady) return;
		// If the action is restart we restart the time counter
		if (this.backoffResult === BackoffAction.restart)
			this.backoffStrategy.reset();
		// If the result is null it means a backoff was already executed, we want to avoid to call it two times
		if (this.backoffResult !== null)
			this.backoffStrategy.backoff();
	}

	reset() {
		this.backoffStrategy.reset();
	}
}

export let backoffFibonacci: Backoff = (options, factory?: BackoffFactory): BackoffExecutor => {

	return (callback: BackoffCallback) => {
		const backoffWrapper = new BackoffWrapper(callback, options, factory);

		return () => backoffWrapper.reset();
	};
};

function getBackoffInstance(options: backoff.ExponentialOptions, factory?: BackoffFactory): backoff.Backoff {
	return factory ? factory(options) : backoff.fibonacci(options);
}

export type BackoffCallback = (continuing: () => void, restarting: () => void, number: number, delay: number, error?: any) => void;

export type BackoffExecutor = (callback: BackoffCallback) => BackoffStopper;

export type BackoffStopper = () => void;

export type Backoff = (options: backoff.ExponentialOptions, createInstance?: (options: backoff.ExponentialOptions) => backoff.Backoff) => BackoffExecutor;
