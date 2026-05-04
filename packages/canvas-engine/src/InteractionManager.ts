import { PanningTool } from "./tools/PanningTool";
import type { InteractionContext, Tool } from "./tools/Tool";
import type { CanvasTool } from "./types";
import { clientPixelToMm } from "./utils/coordinates";

export class InteractionManager {
	private tools: Map<CanvasTool, Tool> = new Map();
	private activeTool: Tool | null = null;
	private panningTool = new PanningTool();
	private container: HTMLElement | null = null;

	constructor(private context: InteractionContext) {}

	mount(container: HTMLElement) {
		this.container = container;
	}

	registerTool(name: CanvasTool, tool: Tool) {
		this.tools.set(name, tool);
	}

	setActiveTool(name: CanvasTool) {
		const tool = this.tools.get(name);
		if (tool) {
			this.activeTool = tool;
		}
	}

	getCursor(): string {
		if (this.context.store.getState().isPanning) {
			return this.panningTool.getCursor();
		}
		return this.activeTool?.getCursor() || "default";
	}

	// --- Middleware & Point Conversion ---

	getMmCoords(e: MouseEvent): { x: number; y: number } {
		if (!this.container) return { x: 0, y: 0 };
		const rect = this.container.getBoundingClientRect();
		const { viewport } = this.context.store.getState();
		return {
			x: clientPixelToMm(e.clientX - rect.left, viewport.pan.x, viewport.scale),
			y: clientPixelToMm(e.clientY - rect.top, viewport.pan.y, viewport.scale),
		};
	}

	// --- Event Handlers ---

	handlePointerDown = async (e: PointerEvent) => {
		if (e.button === 1 || e.button === 2) {
			this.panningTool.onPointerDown(e, this.context);
			return;
		}

		const state = this.context.store.getState();
		if (state.isPanning) {
			this.context.store.update({ isPanning: false, lastPanPos: null });
		}

		const coords = this.getMmCoords(e);
		// Middleware: Notify Worker with stylus data
		await this.context.gateway.pointerDown(
			coords.x,
			coords.y,
			e.pressure,
			e.tiltX,
			e.tiltY,
		);

		this.activeTool?.onPointerDown(e, this.context, coords);
	};

	handlePointerMove = async (e: PointerEvent) => {
		const state = this.context.store.getState();
		if (state.isPanning) {
			this.panningTool.onPointerMove(e, this.context);
			return;
		}

		const coords = this.getMmCoords(e);
		// Middleware: Notify Worker with stylus data
		await this.context.gateway.pointerMove(
			coords.x,
			coords.y,
			e.pressure,
			e.tiltX,
			e.tiltY,
		);

		this.activeTool?.onPointerMove(e, this.context, coords);
	};

	handlePointerUp = async (e: PointerEvent) => {
		const state = this.context.store.getState();
		if (state.isPanning) {
			this.panningTool.onPointerUp(e, this.context);
			return;
		}

		const coords = this.getMmCoords(e);
		// Tool handles the transition (drawing finalize, etc.)
		await this.activeTool?.onPointerUp(e, this.context, coords);
	};

	handleDoubleClick = (e: MouseEvent) => {
		const coords = this.getMmCoords(e);
		this.activeTool?.onDoubleClick?.(e, this.context, coords);
	};
}
