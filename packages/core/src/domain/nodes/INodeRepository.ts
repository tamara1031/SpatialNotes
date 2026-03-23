import type { Node } from "./Node";

/**
 * Interface for the node repository.
 * Handles the persistence and retrieval of node domain entities.
 */
export interface INodeRepository {
	/**
	 * Saves a node to the repository.
	 * If the node already exists, it will be updated.
	 */
	save(node: Node): Promise<void>;

	/**
	 * Finds a node by its unique identifier.
	 */
	findById(id: string): Promise<Node | null>;

	/**
	 * Finds all nodes in the repository for a specific user.
	 */
	findAll(userId: string): Promise<Node[]>;

	/**
	 * Finds all nodes with the given parent identifier for a specific user.
	 * Pass null to find root-level nodes.
	 */
	findByParentId(parentId: string | null, userId: string): Promise<Node[]>;
}
