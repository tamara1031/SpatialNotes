import type { ElementFactory, EngineInterface } from "engine-core";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "./ui/schema";
import { MarkdownWorkerGateway } from "./bridge/MarkdownWorkerGateway";
import type {
	MarkdownElement,
	MarkdownEngineContext,
	MarkdownViewport,
} from "./types";
import { nanoid } from "nanoid";
import { keymap } from "prosemirror-keymap";
import { history, undo, redo } from "prosemirror-history";
import { baseKeymap } from "prosemirror-commands";
import { inputRules, smartQuotes, ellipsis, emDash, SEMIDASH } from "prosemirror-inputrules";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { tableEditing, columnResizing } from "prosemirror-tables";
import { Node } from "prosemirror-model";

/**
 * ProseMirror Plugin to ensure all top-level blocks have a stable ID.
 */
import { Plugin } from "prosemirror-state";

export const blockIdPlugin = new Plugin({
	appendTransaction(transactions, oldState, newState) {
		const tr = newState.tr;
		let modified = false;

		newState.doc.forEach((node, offset) => {
			if (node.type.isBlock && !node.attrs.id) {
				tr.setNodeMarkup(offset, undefined, { ...node.attrs, id: nanoid() });
				modified = true;
			}
		});

		return modified ? tr : null;
	},
});

export class MarkdownEngine
	implements
		EngineInterface<MarkdownElement, MarkdownViewport, MarkdownEngineContext>
{
	private elements: MarkdownElement[] = [];
	private viewport: MarkdownViewport = { scrollPosition: 0, zoom: 1.0 };
	private status: "LOADING" | "READY" | "ERROR" = "LOADING";
	private onActionCallback?: (action: { type: string; payload?: any }) => void;
	private gateway: MarkdownWorkerGateway;
	private view: EditorView | null = null;

	constructor(
		width: number,
		height: number,
		elementFactory: ElementFactory<MarkdownElement>,
	) {
		this.gateway = new MarkdownWorkerGateway();

		// Initialize WASM
		this.gateway
			.init()
			.then(() => {
				this.status = "READY";
				this.onActionCallback?.({ type: "STATUS", payload: "READY" });
			})
			.catch((err) => {
				this.status = "ERROR";
				this.onActionCallback?.({
					type: "STATUS",
					payload: "ERROR",
					error: err.message,
				});
			});
	}

	mount(container: HTMLElement) {
		// Initialization of the view is typically handled by the React component
		// but we expose the logic if needed.
	}

	unmount() {
		this.view?.destroy();
		this.view = null;
	}

	destroy() {
		this.unmount();
		this.gateway.terminate();
	}

	/**
	 * Synchronizes blocks from the shell to the internal editor state.
	 */
	update(
		patch: Partial<{ elements: MarkdownElement[]; viewport: MarkdownViewport }>,
	) {
		if (patch.viewport) {
			this.viewport = patch.viewport;
		}

		if (patch.elements && this.view) {
			const currentElements = this.elements;
			const nextElements = patch.elements;

			// Simple check to see if we actually need to update the doc
			// In a real app, we'd do a more granular diff or use Yjs
			if (JSON.stringify(currentElements) !== JSON.stringify(nextElements)) {
				this.elements = nextElements;
				// Re-initialize doc from elements if it changed externally
				// (e.g. initial load or remote sync)
				const doc = this.createDocFromElements(nextElements);
				const state = EditorState.create({
					doc,
					plugins: this.view.state.plugins,
				});
				this.view.updateState(state);
			}
		} else if (patch.elements) {
			this.elements = patch.elements;
		}
	}

	updateContext(context: MarkdownEngineContext) {
		// Handle read-only mode etc.
	}

	getState(): { elements: MarkdownElement[]; viewport: MarkdownViewport } {
		return {
			elements: this.elements,
			viewport: this.viewport,
		};
	}

	onAction(callback: (action: { type: string; payload?: any }) => void) {
		this.onActionCallback = callback;
		if (this.status === "READY") {
			callback({ type: "STATUS", payload: "READY" });
		}
	}

	handleKeyDown(e: KeyboardEvent): boolean {
		// ProseMirror handles its own keys, but we could intercept here
		return false;
	}

	async exportToSVG(): Promise<string> {
		const markdown = this.elements
			.map((el) => el.content)
			.join("\n\n");
		const html = await this.gateway.renderHtml(markdown);
		return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${html}</div></foreignObject></svg>`;
	}

	/**
	 * Internal helper to map ProseMirror doc to elements.
	 */
	mapDocToElements(doc: Node): MarkdownElement[] {
		const elements: MarkdownElement[] = [];
		doc.forEach((node, offset, index) => {
			const type = this.mapProseMirrorTypeToElement(node.type.name);
			if (!type) return;

			elements.push({
				id: node.attrs.id || nanoid(),
				type: type as any,
				parentId: null,
				content: node.textContent, // Simplified for now
				metadata: {
					...node.attrs,
					kind: node.type.name.toUpperCase(),
				},
				updatedAt: Date.now(),
			});
		});
		return elements;
	}

	private createDocFromElements(elements: MarkdownElement[]): Node {
		const nodes: Node[] = elements.map((el) => {
			const typeName = el.metadata.kind?.toLowerCase() || "paragraph";
			const nodeType = schema.nodes[typeName] || schema.nodes.paragraph;
			return nodeType.createAndFill(el.metadata, schema.text(el.content))!;
		});
		return schema.nodes.doc.createAndFill(null, nodes)!;
	}

	private mapProseMirrorTypeToElement(pmType: string): string | null {
		switch (pmType) {
			case "paragraph": return "PARAGRAPH";
			case "heading": return "HEADING";
			case "table": return "TABLE";
			case "image": return "IMAGE";
			case "latex": return "LATEX";
			case "code_block": return "CODE";
			default: return "PARAGRAPH";
		}
	}

	setEditorView(view: EditorView) {
		this.view = view;
	}
}

export * from "./types";
export * from "./ui/MarkdownView";
export { schema } from "./ui/schema";
