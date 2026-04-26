export type NodeType =
	| "CHAPTER"
	| "NOTEBOOK"
	| "ELEMENT_STROKE"
	| "ELEMENT_IMAGE"
	| "ELEMENT_TEXT";

export type EncryptionStrategy = "STANDARD" | "E2EE";

// ── Typed metadata shapes per element type ────────────────────────────────────

/** Shared bounding-box fields written by the WASM engine after path analysis. */
interface BoundingBox {
	min_x?: number;
	min_y?: number;
	max_x?: number;
	max_y?: number;
}

export interface StrokeMetadata extends BoundingBox {
	points: number[];
	color: string;
	width: number;
	z_index: number;
}

export interface ImageMetadata extends BoundingBox {
	src: string;
	z_index: number;
}

export interface TextMetadata extends BoundingBox {
	content: string;
	z_index: number;
}

/** Metadata for container nodes (no typed fields required). */
export type ContainerMetadata = Record<string, never>;

/** Discriminated map from NodeType to its metadata shape. */
export type NodeMetadataMap = {
	ELEMENT_STROKE: StrokeMetadata;
	ELEMENT_IMAGE: ImageMetadata;
	ELEMENT_TEXT: TextMetadata;
	NOTEBOOK: ContainerMetadata;
	CHAPTER: ContainerMetadata;
};

// ── NodeRecord ────────────────────────────────────────────────────────────────

export interface NodeRecord {
	id: string;
	parentId: string | null;
	userId: string;
	type: NodeType;
	name?: string;
	/**
	 * Metadata is intentionally kept as an open record at the persistence
	 * boundary so that serialised data (Yjs, SQLite, JSON over the wire) is
	 * not constrained by the TypeScript type checker.  Domain entities narrow
	 * this field via `declare protected record` in their subclass definition.
	 */
	metadata: Record<string, unknown>;
	encryptionStrategy: EncryptionStrategy;
	createdAt: number;
	updatedAt: number;
	isDeleted?: boolean;
	position?: { x: number; y: number } | null;
}

export class CircularReferenceError extends Error {
	constructor() {
		super("Circular reference detected in node hierarchy");
		this.name = "CircularReferenceError";
	}
}

export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}

/** Minimal structural interface used by the visitor to avoid circular imports. */
export interface VisitableNode {
	readonly id: string;
	readonly type: string;
}

export interface CanvasElementVisitor {
	visitElement(element: VisitableNode): void;
	visitChapter?(chapter: VisitableNode): void;
	visitNotebook?(notebook: VisitableNode): void;
}

export type NoteTool =
	| "PEN"
	| "ERASER"
	| "ERASER_PRECISION"
	| "TEXT"
	| "SELECTOR"
	| "PICKER"
	| "HIGHLIGHTER"
	| "HAND";

export type LayoutMode = "SINGLE" | "INFINITE";
export type Orientation = "PORTRAIT" | "LANDSCAPE";
