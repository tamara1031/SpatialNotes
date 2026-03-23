import type { NodeRecord } from "@spatial-notes/core";
import { atom } from "nanostores";

/**
 * Tree structure for UI representation.
 */
export interface TreeNode extends NodeRecord {
	children: TreeNode[];
}

/**
 * Reactive store for the hierarchical node tree.
 */
export const $nodeTree = atom<TreeNode[]>([]);

/**
 * Reactive store for the currently active node ID.
 */
export const $activeNodeId = atom<string | null>(null);

/**
 * Reactive store for any global domain errors.
 */
export const $domainError = atom<Error | null>(null);
