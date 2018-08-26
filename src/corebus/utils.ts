export function isPromise<T = any>(item: any): item is Promise<T> {
	return Promise.resolve(item) === item;
}
