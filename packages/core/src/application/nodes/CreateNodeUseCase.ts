import {
	type IDomainEventBus,
	globalEventBus,
} from "../../domain/events/DomainEventBus.js";
import { NodeCreatedEvent } from "../../domain/nodes/events.js";
import type { INodeRepository } from "../../domain/nodes/INodeRepository.js";
import { NodeFactory } from "../../domain/nodes/NodeFactory.js";
import { type NodeType, ValidationError } from "../../domain/types.js";
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
	type: string;
	userId: string;
	metadata?: Record<string, unknown>;
}

const VALID_NODE_TYPES = new Set<NodeType>([
	"CHAPTER",
	"NOTEBOOK",
	"ELEMENT_STROKE",
	"ELEMENT_IMAGE",
	"ELEMENT_TEXT",
]);

export class CreateNodeUseCase {
	constructor(
		private readonly nodeRepository: INodeRepository,
		private readonly vaultStatusProvider: IVaultStatusProvider,
		private readonly eventBus: IDomainEventBus = globalEventBus,
	) {}

	async execute(input: CreateNodeInput): Promise<void> {
		const status = this.vaultStatusProvider.getStatus();
		if (status.isLocked()) {
			throw new VaultLockedError();
		}

		const normalised = input.type.toUpperCase() as NodeType;
		if (!VALID_NODE_TYPES.has(normalised)) {
			throw new ValidationError(`Unknown node type: ${input.type}`);
		}

		const record = NodeFactory.createRecord(
			normalised,
			input.parentId,
			input.userId,
			(input.metadata ?? {}) as any,
			input.name,
		);

		const node = NodeFactory.create(record);
		await this.nodeRepository.save(node);

		this.eventBus.publish(new NodeCreatedEvent(record));
	}
}
