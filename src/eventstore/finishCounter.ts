export class FinishCounter {
	counter = 0;
	activePromise: Promise<void> = Promise.resolve();
	succeedPromise: Function | void = undefined;
 
	constructor() {
		this.createPromise();
	}

	protected createPromise() {
		this.activePromise = new Promise(succeed => {
			this.succeedPromise = succeed;
		});
	}

	increase() {
		this.counter++;
	}

	decrease() {
		if(this.counter <= 0) throw new CounterUnderZero();
		this.counter--;
		if(this.counter === 0 && this.succeedPromise) return this.succeedPromise();
	}

	waitUntilZero() {
		return this.activePromise;
	}
}

export class CounterUnderZero<T> extends Error {
	constructor() {
		super();
		this.message = 'Counter cannot be under 0. This can be because a double count in the code. This is a problem of the usage of this module and provably is denoting a error in your code';
	}
}
