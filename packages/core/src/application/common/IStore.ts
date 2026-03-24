export interface IKeyValueStore<T = any> {
	get(key: string): T | undefined;
	set(key: string, value: T): void;
	delete(key: string): void;
	has(key: string): boolean;
	keys(): string[];
	transact(action: () => void): void;
}
