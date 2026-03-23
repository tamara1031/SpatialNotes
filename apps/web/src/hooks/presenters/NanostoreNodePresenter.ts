import type { INodePresenter, Node } from "@spatial-notes/core";
import { $domainError, $nodeTree, type TreeNode } from "../../store/nodes";

/**
 * Implementation of INodePresenter that updates Nanostores.
 */
export class NanostoreNodePresenter implements INodePresenter {
	/**
	 * Transforms domain nodes into a hierarchical tree and updates the $nodeTree store.
	 */
	public presentNodes(nodes: Node[]): void {
		const tree = this.buildTree(nodes);
		$nodeTree.set(tree);
	}

	/**
	 * Updates the $domainError store with the given error.
	 */
	public presentError(error: Error): void {
		$domainError.set(error);
	}

	/**
	 * Helper method to transform a flat list of nodes into a tree structure.
	 */
	private buildTree(nodes: Node[]): TreeNode[] {
		const tree: TreeNode[] = [];
		const nodeMap: Record<string, TreeNode> = {};

		// Filter deleted nodes and sort by updatedAt
		const activeNodes = nodes
			.filter((n) => !n.isDeleted)
			.sort((a, b) => a.updatedAt - b.updatedAt);

		// Create TreeNode objects from records
		activeNodes.forEach((node) => {
			const treeNode: TreeNode = {
				...node.toRecord(),
				children: [],
			};
			nodeMap[node.id] = treeNode;
		});

		// Build hierarchy
		activeNodes.forEach((node) => {
			const parentId = node.parentId;
			if (parentId && nodeMap[parentId]) {
				nodeMap[parentId].children.push(nodeMap[node.id]);
			} else if (!parentId) {
				const rootNode = nodeMap[node.id];
				if (rootNode) tree.push(rootNode);
			}
		});

		return tree;
	}
}
