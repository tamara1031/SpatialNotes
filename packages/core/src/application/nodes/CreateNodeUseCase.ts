import { globalEventBus } from "../../domain/events/DomainEventBus.js";
import { NodeCreatedEvent } from "../../domain/nodes/events.js";
import type { INodeRepository } from "../../domain/nodes/INodeRepository.js";
import { NodeFactory } from "../../domain/nodes/NodeFactory.js";
import type { VaultStatus } from "../../domain/vault/VaultStatus.js";

export class VaultLockedError extends Error {
	constructor() {
		super("Vault is locked");
		this.name = "VaultLockedError";
	}
}

export interface IVaultStatusProvider {
	getStatus(): VaultStatus;
}

export interface CreateNodeInput {
	parentId: string | null;
	name: string;
	type: string; // "chapter" | "notebook" or others
	userId: string;
	metadata?: any;
}

export class CreateNodeUseCase {
	constructor(
		private readonly nodeRepository: INodeRepository,
		private readonly vaultStatusProvider: IVaultStatusProvider,
	) {}

	async execute(input: CreateNodeInput): Promise<void> {
		const status = this.vaultStatusProvider.getStatus();
		if (status.isLocked()) {
			throw new VaultLockedError();
		}

		// Map input type to domain NodeType or handle directly in factory
		const type =
			input.type.toUpperCase() === "CHAPTER" ? "CHAPTER" : "NOTEBOOK";

		const record = NodeFactory.createRecord(
			type as any,
			input.parentId,
			input.userId,
			input.metadata || {},
			input.name,
		);

		const node = NodeFactory.create(record);
		await this.nodeRepository.save(node);

		// Publish event
		globalEventBus.publish(new NodeCreatedEvent(record));
	}
}
