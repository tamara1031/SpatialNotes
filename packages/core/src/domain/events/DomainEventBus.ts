export interface IDomainEvent<T = any> {
	type: string;
	payload: T;
	occurredAt: number;
}

export type DomainEventHandler<T = any> = (event: IDomainEvent<T>) => void;

// Minimal publish-side contract. Use cases depend on this abstraction rather
// than on the concrete DomainEventBus, enabling injection of a test double
// without touching the global singleton.
export interface IDomainEventBus {
	publish(event: IDomainEvent): void;
}

export class DomainEventBus implements IDomainEventBus {
	private handlers = new Map<string, DomainEventHandler[]>();

	publish(event: IDomainEvent): void {
		const handlers = this.handlers.get(event.type) || [];
		for (const handler of handlers) {
			try {
				handler(event);
			} catch (err) {
				// Isolate bad handlers so one subscriber cannot break the chain.
				console.error(
					`[DomainEventBus] handler for "${event.type}" threw:`,
					err,
				);
			}
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
