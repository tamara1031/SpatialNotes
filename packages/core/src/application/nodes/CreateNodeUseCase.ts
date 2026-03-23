import { globalEventBus } from "../../domain/events/DomainEventBus";
import { NodeCreatedEvent } from "../../domain/nodes/events";
import type { INodeRepository } from "../../domain/nodes/INodeRepository";
import { NodeFactory } from "../../domain/nodes/NodeFactory";
import type { VaultStatus } from "../../domain/vault/VaultStatus";

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
			{},
			input.name,
		);

		const node = NodeFactory.create(record);
		await this.nodeRepository.save(node);

		// Publish event
		globalEventBus.publish(new NodeCreatedEvent(record));
	}
}
