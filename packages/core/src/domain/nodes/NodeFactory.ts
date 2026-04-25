import {
	type NodeMetadataMap,
	type NodeRecord,
	type NodeType,
	ValidationError,
} from "../types.js";
import {
	Chapter,
	ImageElement,
	type Node,
	Notebook,
	StrokeElement,
	TextElement,
} from "./Node.js";

export type NodeConstructor = new (record: NodeRecord) => Node;

const registry = new Map<string, NodeConstructor>();

export const NodeFactory = {
	register(type: string, NodeCtor: NodeConstructor): void {
		registry.set(type, NodeCtor);
	},

	create(record: NodeRecord): Node {
		const Constructor = registry.get(record.type);
		if (!Constructor) {
			throw new ValidationError(`Unknown node type: ${record.type}`);
		}

		// Runtime guards for data arriving from persistence (Yjs, SQLite, wire).
		if (record.type === "ELEMENT_IMAGE" && !record.metadata.src) {
			throw new ValidationError("ELEMENT_IMAGE requires src in metadata");
		}
		if (
			record.type === "ELEMENT_TEXT" &&
			record.metadata.content === undefined
		) {
			throw new ValidationError("ELEMENT_TEXT requires content in metadata");
		}

		return new Constructor(record);
	},

	/**
	 * Create a fresh NodeRecord with compile-time typed metadata.
	 *
	 * The generic parameter `T` binds the `metadata` argument to the shape
	 * declared in `NodeMetadataMap`, giving call-sites full type inference:
	 *
	 *   NodeFactory.createRecord("ELEMENT_STROKE", ..., { points: [...], color: "#fff", width: 1, z_index: 0 })
	 *   //                                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	 *   //                                              TypeScript verifies the shape against StrokeMetadata
	 */
	createRecord<T extends NodeType>(
		type: T,
		parentId: string | null,
		userId: string,
		metadata: Partial<NodeMetadataMap[T]> = {} as Partial<NodeMetadataMap[T]>,
		name = "",
	): NodeRecord {
		const base = metadata as Record<string, unknown>;
		return {
			id: globalThis.crypto.randomUUID(),
			parentId,
			userId,
			type,
			name,
			metadata: { ...base, z_index: (base.z_index as number) || Date.now() },
			encryptionStrategy: "STANDARD",
			createdAt: Date.now(),
			updatedAt: Date.now(),
			isDeleted: false,
			position: null,
		};
	},
};

// Default registrations
NodeFactory.register("CHAPTER", Chapter);
NodeFactory.register("NOTEBOOK", Notebook);
NodeFactory.register("ELEMENT_STROKE", StrokeElement);
NodeFactory.register("ELEMENT_IMAGE", ImageElement);
NodeFactory.register("ELEMENT_TEXT", TextElement);
