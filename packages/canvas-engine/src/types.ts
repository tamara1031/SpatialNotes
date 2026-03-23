import type { BaseElement } from "engine-core";

export type CanvasLayoutMode = "SINGLE" | "INFINITE";
export type CanvasOrientation = "PORTRAIT" | "LANDSCAPE";

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
}
