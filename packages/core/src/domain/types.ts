export type NodeType =
	| "CHAPTER"
	| "NOTEBOOK"
	| "ELEMENT_STROKE"
	| "ELEMENT_IMAGE"
	| "ELEMENT_TEXT";

export type EncryptionStrategy = "STANDARD" | "E2EE";

export interface NodeRecord {
	id: string;
	parentId: string | null;
	userId: string;
	type: NodeType;
	name?: string;
	metadata: Record<string, any>;
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

export interface CanvasElementVisitor {
	visitElement(element: any): void;
	visitChapter?(chapter: any): void;
	visitNotebook?(notebook: any): void;
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
