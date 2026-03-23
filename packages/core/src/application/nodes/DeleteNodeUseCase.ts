import { globalEventBus } from "../../domain/events/DomainEventBus";
import type { INodeRepository } from "../../domain/nodes/INodeRepository";
import { SubtreeDeletionService } from "../../domain/nodes/SubtreeDeletionService";

export interface DeleteNodeInput {
	id: string;
	userId: string;
}

export class DeleteNodeUseCase {
	private readonly subtreeService: SubtreeDeletionService;

	constructor(private readonly nodeRepository: INodeRepository) {
		this.subtreeService = new SubtreeDeletionService(nodeRepository);
	}

	async execute(input: DeleteNodeInput): Promise<void> {
		const node = await this.nodeRepository.findById(input.id);
		if (!node) {
			throw new Error(`Node not found: ${input.id}`);
		}

		if (node.userId !== input.userId) {
			throw new Error("Unauthorized to delete this node");
		}

		// Use domain service for recursive deletion
		const deletedNodes = await this.subtreeService.markSubtreeAsDeleted(
			input.id,
			input.userId,
		);

		// Publish events that were collected by the entities
		for (const deletedNode of deletedNodes) {
			for (const event of deletedNode.domainEvents) {
				globalEventBus.publish(event);
			}
			deletedNode.clearDomainEvents();
		}
	}
}
