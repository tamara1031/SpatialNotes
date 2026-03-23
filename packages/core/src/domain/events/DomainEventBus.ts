export interface IDomainEvent<T = any> {
	type: string;
	payload: T;
	occurredAt: number;
}

export type DomainEventHandler<T = any> = (event: IDomainEvent<T>) => void;

export class DomainEventBus {
	private handlers = new Map<string, DomainEventHandler[]>();

	publish(event: IDomainEvent): void {
		const handlers = this.handlers.get(event.type) || [];
		for (const handler of handlers) {
			handler(event);
		}
	}

	subscribe(type: string, handler: DomainEventHandler): () => void {
		const handlers = this.handlers.get(type) || [];
		handlers.push(handler);
		this.handlers.set(type, handlers);

		return () => {
			const current = this.handlers.get(type) || [];
			this.handlers.set(
				type,
				current.filter((h) => h !== handler),
			);
		};
	}

	clear(): void {
		this.handlers.clear();
	}
}

// Global instance for convenience (can be overriden via DI)
export const globalEventBus = new DomainEventBus();
