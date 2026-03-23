import type { BaseElement } from "engine-core";

export enum MarkdownTool {
	TEXT = "TEXT",
	TABLE = "TABLE",
	IMAGE = "IMAGE",
	LATEX = "LATEX",
	CODE = "CODE",
	SELECT = "SELECT",
}

export interface MarkdownViewport {
	scrollPosition: number;
	zoom: number;
}

export interface MarkdownEngineContext {
	activeNodeId?: string;
	isReadOnly?: boolean;
}

export interface MarkdownBlock extends BaseElement {
	type: "PARAGRAPH" | "HEADING" | "TABLE" | "IMAGE" | "LATEX" | "CODE";
	content: string;
	metadata: {
		level?: number;
		alt?: string;
		src?: string;
		isRendered?: boolean;
		language?: string;
		[key: string]: any;
	};
}

export type MarkdownElement = MarkdownBlock;
