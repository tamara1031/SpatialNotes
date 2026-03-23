import type { Node } from "./Node";

/**
 * Interface for node presentation.
 * Used to update the UI with node-related data or errors.
 */
export interface INodePresenter {
	/**
	 * Presents the given nodes to the view.
	 */
	presentNodes(nodes: Node[]): void;

	/**
	 * Presents an error to the view.
	 */
	presentError(error: Error): void;
}
