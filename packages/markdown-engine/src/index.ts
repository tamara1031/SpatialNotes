import type { ElementFactory, EngineInterface } from "engine-core";
import { MarkdownWorkerGateway } from "./bridge/MarkdownWorkerGateway";
import type {
	MarkdownElement,
	MarkdownEngineContext,
	MarkdownViewport,
} from "./types";

export class MarkdownEngine
	implements
		EngineInterface<MarkdownElement, MarkdownViewport, MarkdownEngineContext>
{
	private elements: MarkdownElement[] = [];
	private viewport: MarkdownViewport = { scrollPosition: 0, zoom: 1.0 };
	private status: "LOADING" | "READY" | "ERROR" = "LOADING";
	private onActionCallback?: (action: { type: string; payload?: any }) => void;
	private gateway: MarkdownWorkerGateway;

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
		// ... React handle this usually, but for consistency:
	}

	unmount() {
		// Cleanup if needed
	}

	destroy() {
		this.gateway.terminate();
	}

	update(
		patch: Partial<{ elements: MarkdownElement[]; viewport: MarkdownViewport }>,
	) {
		if (patch.elements) {
			this.elements = patch.elements;
		}
		if (patch.viewport) {
			this.viewport = patch.viewport;
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
		// Notify immediately if already ready
		if (this.status === "READY") {
			callback({ type: "STATUS", payload: "READY" });
		}
	}

	handleKeyDown(e: KeyboardEvent): boolean {
		return false;
	}

	async exportToSVG(): Promise<string> {
		const markdown = this.elements
			.map((el) => el.metadata.content)
			.join("\n\n");
		const html = await this.gateway.renderHtml(markdown);
		return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${html}</div></foreignObject></svg>`;
	}
}

export * from "./types";
export * from "./ui/MarkdownView";
