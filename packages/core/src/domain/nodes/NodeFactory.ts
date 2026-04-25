import { type NodeRecord, type NodeType, ValidationError } from "../types.js";
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

	createRecord(
		type: NodeType,
		parentId: string | null,
		userId: string,
		metadata: any = {},
		name: string = "",
	): NodeRecord {
		return {
			id: globalThis.crypto.randomUUID(),
			parentId,
			userId,
			type,
			name,
			metadata: { ...metadata, z_index: metadata.z_index || Date.now() },
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
