import type * as Y from "yjs";
import type { INodeRepository } from "../../domain/nodes/INodeRepository";
import type { Node } from "../../domain/nodes/Node";
import { NodeFactory } from "../../domain/nodes/NodeFactory";

/**
 * Implementation of INodeRepository using Yjs for real-time synchronization.
 */
export class YjsNodeRepository implements INodeRepository {
	private readonly nodes: Y.Map<any>;

	constructor(private readonly doc: Y.Doc) {
		this.nodes = this.doc.getMap("nodes");
	}

	public async save(node: Node): Promise<void> {
		this.nodes.set(node.id, node.toRecord());
	}

	public async findById(id: string): Promise<Node | null> {
		const data = this.nodes.get(id);
		if (!data) return null;
		return this.mapToEntity(data);
	}

	public async findAll(userId: string): Promise<Node[]> {
		const result: Node[] = [];
		for (const data of this.nodes.values()) {
			if (data.userId === userId) {
				result.push(this.mapToEntity(data));
			}
		}
		return result;
	}

	public async findByParentId(
		parentId: string | null,
		userId: string,
	): Promise<Node[]> {
		const result: Node[] = [];
		for (const data of this.nodes.values()) {
			if (data.userId === userId && data.parentId === parentId) {
				result.push(this.mapToEntity(data));
			}
		}
		return result;
	}

	private mapToEntity(data: any): Node {
		return NodeFactory.create(data as any);
	}
}
