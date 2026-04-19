import type { NodeRecord } from "../domain/types.js";
import type { IKeyValueStore } from "./common/IStore.js";

export abstract class Command {
	abstract execute(): void;
}

export class CreateElementCommand extends Command {
	constructor(
		private readonly storage: IKeyValueStore<NodeRecord>,
		private readonly record: NodeRecord,
	) {
		super();
	}

	execute(): void {
		this.storage.set(this.record.id, this.record);
	}
}

export class DeleteElementCommand extends Command {
	constructor(
		private readonly storage: IKeyValueStore<any>,
		private readonly id: string,
	) {
		super();
	}

	execute(): void {
		this.storage.delete(this.id);
	}
}

/**
 * Applies a batch of partial updates to existing elements.
 *
 * Each entry in `updates` is a delta against the current record in the store
 * (`{ id, changes }`). Missing records are skipped silently. Updates are
 * committed inside a single store transaction.
 */
export interface ElementUpdate {
	id: string;
	changes: Partial<NodeRecord>;
}

export class UpdateElementsCommand extends Command {
	constructor(
		private readonly storage: IKeyValueStore<NodeRecord>,
		private readonly updates: ElementUpdate[],
	) {
		super();
	}

	execute(): void {
		this.storage.transact(() => {
			for (const { id, changes } of this.updates) {
				const existing = this.storage.get(id);
				if (!existing) continue;
				this.storage.set(id, {
					...existing,
					...changes,
					metadata: { ...existing.metadata, ...(changes.metadata ?? {}) },
					updatedAt: Date.now(),
				});
			}
		});
	}
}

export class UpdateNodeCommand extends Command {
	constructor(
		private readonly storage: IKeyValueStore<NodeRecord>,
		private readonly update: Partial<NodeRecord> & { id: string },
	) {
		super();
	}

	execute(): void {
		const existing = this.storage.get(this.update.id);
		if (existing) {
			this.storage.set(this.update.id, {
				...existing,
				...this.update,
				updatedAt: Date.now(),
			});
		}
	}
}
