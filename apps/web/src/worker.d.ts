declare module "*?worker" {
	const workerConstructor: {
		new (): Worker;
	};
	export default workerConstructor;
}

declare module "*?worker&url" {
	const src: string;
	export default src;
}
