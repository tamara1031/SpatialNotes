import type { BaseElement } from "engine-core";

export type CanvasLayoutMode = "SINGLE" | "INFINITE";
export type CanvasOrientation = "PORTRAIT" | "LANDSCAPE";

// Typed update record emitted by UPDATE_ELEMENTS commands.
export type CanvasElementUpdate = {
	id: string;
	changes: Partial<Omit<CanvasElement, "id">>;
};

// Discriminated union of all commands CanvasStore can emit to external listeners.
export type CanvasStoreCommand =
	| { type: "CREATE"; payload: CanvasElement }
	| { type: "UPDATE_ELEMENTS"; payload: CanvasElementUpdate[] }
	| {
			type: "BATCH";
			payload: Array<{ type: "DELETE"; payload: { id: string } }>;
	  }
	| { type: "UNDO" }
	| { type: "REDO" };

// All events CanvasEngine can emit to the shell via onAction().
export type CanvasEngineEvent =
	| { type: "STATUS"; payload: "LOADING" | "READY" | "ERROR" }
	| { type: "EXPORT_RESULT"; payload: string }
	| CanvasStoreCommand;

export enum CanvasTool {
	PEN = "PEN",
	HIGHLIGHTER = "HIGHLIGHTER",
	ERASER = "ERASER",
	ERASER_PRECISION = "ERASER_PRECISION",
	SELECTOR = "SELECTOR",
	PICKER = "PICKER",
	TEXT = "TEXT",
	IMAGE = "IMAGE",
}

export interface CanvasElement extends BaseElement {
	name?: string;
}

export interface CanvasViewport {
	pan: { x: number; y: number };
	scale: number;
}

export interface CanvasEngineContext {
	activeNodeId: string;
	pageSize: { width: number; height: number };
	layoutMode: CanvasLayoutMode;
	penConfig?: { color: string; width: number };
	highlighterConfig?: { color: string; width: number };
	activeTool?: CanvasTool;
	command?: "EXPORT_SVG";
}
