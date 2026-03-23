import type { INodeRepository } from "./INodeRepository";
import type { Node } from "./Node";

/**
 * Domain service to handle subtree deletion logic.
 */
export class SubtreeDeletionService {
	constructor(private readonly nodeRepository: INodeRepository) {}

	/**
	 * Recursively marks a node and all its descendants as deleted.
	 * This service implements the business rules for subtree deletion.
	 */
	async markSubtreeAsDeleted(nodeId: string, userId: string): Promise<Node[]> {
		const deletedNodes: Node[] = [];

		const node = await this.nodeRepository.findById(nodeId);
		if (!node || node.userId !== userId) {
			return [];
		}

		// Perform deletion
		node.delete();
		await this.nodeRepository.save(node);
		deletedNodes.push(node);

		// Recursively find and delete children
		const children = await this.nodeRepository.findByParentId(nodeId, userId);
		for (const child of children) {
			const subDeleted = await this.markSubtreeAsDeleted(child.id, userId);
			deletedNodes.push(...subDeleted);
		}

		return deletedNodes;
	}
}
