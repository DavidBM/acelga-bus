import * as debug from 'debug';

export function debugLogger (debuggerFunction: debug.IDebugger) {
	return (...args: any[]) => {
		if(args.length > 0){
			return Promise.resolve(debuggerFunction(args[0], ...args.splice(1)));
		}

		return Promise.resolve();
	};
}
