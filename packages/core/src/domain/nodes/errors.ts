export class NodeNotFoundError extends Error {
	constructor(public readonly nodeId: string) {
		super(`Node not found: ${nodeId}`);
		this.name = "NodeNotFoundError";
	}
}

export class NodeOwnershipError extends Error {
	constructor() {
		super("Unauthorized: caller does not own this node");
		this.name = "NodeOwnershipError";
	}
}
