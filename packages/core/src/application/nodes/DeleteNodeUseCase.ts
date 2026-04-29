import {
	globalEventBus,
	type IDomainEventBus,
} from "../../domain/events/DomainEventBus.js";
import {
	NodeNotFoundError,
	NodeOwnershipError,
} from "../../domain/nodes/errors.js";
import type { INodeRepository } from "../../domain/nodes/INodeRepository.js";
import { SubtreeDeletionService } from "../../domain/nodes/SubtreeDeletionService.js";
import { publishAndClear } from "./publishAndClear.js";

export interface DeleteNodeInput {
	id: string;
	userId: string;
}

export class DeleteNodeUseCase {
	private readonly subtreeService: SubtreeDeletionService;

	constructor(
		private readonly nodeRepository: INodeRepository,
		private readonly eventBus: IDomainEventBus = globalEventBus,
	) {
		this.subtreeService = new SubtreeDeletionService(nodeRepository);
	}

	async execute(input: DeleteNodeInput): Promise<void> {
		const node = await this.nodeRepository.findById(input.id);
		if (!node) {
			throw new NodeNotFoundError(input.id);
		}

		if (node.userId !== input.userId) {
			throw new NodeOwnershipError();
		}

		// Use domain service for recursive deletion
		const deletedNodes = await this.subtreeService.markSubtreeAsDeleted(
			input.id,
			input.userId,
		);

		for (const deletedNode of deletedNodes) {
			publishAndClear(deletedNode, this.eventBus);
		}
	}
}
