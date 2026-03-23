import * as Y from "yjs";

export interface SyncServiceOptions {
	roomId: string;
}

/**
 * Service to manage real-time synchronization using Yjs.
 */
export class SyncService {
	public readonly ydoc: Y.Doc;
	public readonly undoManager: Y.UndoManager;
	private readonly nodes: Y.Map<any>;
	private readonly elements: Y.Map<any>;

	constructor(_options: SyncServiceOptions) {
		this.ydoc = new Y.Doc();
		this.nodes = this.ydoc.getMap("nodes");
		this.elements = this.ydoc.getMap("elements");
		this.undoManager = new Y.UndoManager([this.nodes, this.elements]);
	}

	public getNodesMap(): Y.Map<any> {
		return this.nodes;
	}

	public getElementsMap(): Y.Map<any> {
		return this.elements;
	}

	public applyUpdate(update: Uint8Array, origin?: any): void {
		Y.applyUpdate(this.ydoc, update, origin);
	}

	public reset(): void {
		this.undoManager.clear();
		this.nodes.clear();
		this.elements.clear();
	}
}
