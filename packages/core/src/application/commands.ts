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

export class UpdateElementsCommand extends Command {
	constructor(
		private readonly storage: IKeyValueStore<NodeRecord>,
		private readonly updates: NodeRecord[],
	) {
		super();
	}

	execute(): void {
		this.storage.transact(() => {
			for (const update of this.updates) {
				this.storage.set(update.id, update);
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
			this.storage.set(this.update.id, { ...existing, ...this.update });
		}
	}
}
