import type * as Y from "yjs";
import type { INodeRepository } from "../../domain/nodes/INodeRepository.js";
import type { Node } from "../../domain/nodes/Node.js";
import { NodeFactory } from "../../domain/nodes/NodeFactory.js";
import type { NodeRecord } from "../../domain/types.js";

/**
 * Implementation of INodeRepository using Yjs for real-time synchronization.
 */
export class YjsNodeRepository implements INodeRepository {
	private readonly nodes: Y.Map<NodeRecord>;

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
			if (data.userId === userId && !data.isDeleted) {
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
			if (
				data.userId === userId &&
				data.parentId === parentId &&
				!data.isDeleted
			) {
				result.push(this.mapToEntity(data));
			}
		}
		return result;
	}

	private mapToEntity(data: NodeRecord): Node {
		return NodeFactory.create(data);
	}
}
