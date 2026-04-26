import type { ElementFactory, EngineInterface } from "engine-core";
import { WorkerGateway } from "./bridge/WorkerGateway";
import { InteractionHandler } from "./InteractionHandler";
import { InteractionManager } from "./InteractionManager";
import type { CanvasRenderer } from "./render/Renderer";
import { SVGRenderer } from "./render/SVGRenderer";
import { WebGPURenderer } from "./render/WebGPURenderer";
import { ClipboardService } from "./services/ClipboardService";
import { DrawingService } from "./services/DrawingService";
import { EraserService } from "./services/EraserService";
import { SelectionService } from "./services/SelectionService";
import { type CanvasState, CanvasStore } from "./store/CanvasStore";
import { DrawingTool } from "./tools/DrawingTool";
import { EraserTool } from "./tools/EraserTool";
import { SelectionTool } from "./tools/SelectionTool";
import type { InteractionContext, Tool } from "./tools/Tool";
import {
	type CanvasElement,
	type CanvasEngineContext,
	CanvasTool,
	type CanvasViewport,
} from "./types";

export * from "./types";
export * from "./ui/CanvasView";
export { pointsToCatmullRomPath } from "./utils/path-smoothing";

/**
 * Plug-and-Play Canvas Engine (Coordinated Architecture).
 * Refactored for ISP and generic management.
 */
export class CanvasEngine
	implements EngineInterface<CanvasElement, CanvasViewport, CanvasEngineContext>
{
	private store: CanvasStore;
	private renderer: CanvasRenderer;
	private interactionManager: InteractionManager;
	private interactionHandler: InteractionHandler;
	private gateway: WorkerGateway;
	private statusListeners: Set<
		(status: "LOADING" | "READY" | "ERROR", message?: string) => void
	> = new Set();
	private eraserService: EraserService;
	private selectionService: SelectionService;
	private drawingService: DrawingService;
	private clipboardService: ClipboardService;

	private onActionCallback?: (action: { type: string; payload?: any }) => void;
	private onViewportChangeCallback:
		| ((viewport: CanvasViewport) => void)
		| null = null;
	private lastEmittedStatus: "LOADING" | "READY" | "ERROR" | null = null;

	constructor(width: number, height: number, elementFactory: ElementFactory) {
		this.gateway = new WorkerGateway();

		this.store = new CanvasStore({
			viewport: { pan: { x: 0, y: 0 }, scale: 1.0 },
		});

		this.eraserService = new EraserService(this.store, this.gateway);
		this.selectionService = new SelectionService(this.store, this.gateway);
		this.drawingService = new DrawingService(this.store, elementFactory);
		this.clipboardService = new ClipboardService();

		this.reportStatus("LOADING", "Initializing Wasm Engine...");

		this.gateway
			.init(width, height)
			.then(() => {
				this.store.update({ status: "READY" });
				this.reportStatus("READY");
			})
			.catch((err) => {
				this.store.update({ status: "ERROR" });
				this.reportStatus("ERROR", err.message);
			});

		this.renderer = this.createSvgRenderer();

		this.store.onAction((action) => {
			this.onActionCallback?.(action);
		});

		this.store.on("ELEMENTS_CHANGED", (elements) => {
			this.syncToWasm(elements);
		});

		this.store.on("VIEWPORT_CHANGED", (viewport) => {
			this.onViewportChangeCallback?.(viewport);
		});

		const ctx: InteractionContext = {
			store: this.store,
			renderer: this.renderer,
			gateway: this.gateway,
			services: {
				drawing: this.drawingService,
				eraser: this.eraserService,
				selection: this.selectionService,
			},
			updateCursor: () =>
				this.renderer.updateCursor(this.interactionManager.getCursor()),
		};

		this.interactionManager = new InteractionManager(ctx);
		this.interactionHandler = new InteractionHandler(
			this.interactionManager,
			this.store,
		);

		const drawTool = new DrawingTool();
		const selectionTool = new SelectionTool();
		const eraserTool = new EraserTool();

		const TOOL_MAPPING: Record<CanvasTool, Tool> = {
			[CanvasTool.PEN]: drawTool,
			[CanvasTool.HIGHLIGHTER]: drawTool,
			[CanvasTool.ERASER]: eraserTool,
			[CanvasTool.ERASER_PRECISION]: eraserTool,
			[CanvasTool.SELECTOR]: selectionTool,
			[CanvasTool.PICKER]: selectionTool,
			[CanvasTool.TEXT]: drawTool,
			[CanvasTool.IMAGE]: drawTool,
		};

		Object.entries(TOOL_MAPPING).forEach(([type, tool]) => {
			this.interactionManager.registerTool(type as CanvasTool, tool);
		});

		this.store.subscribe(() => {
			const state = this.store.getState();
			this.renderer.render(state);
			this.renderer.renderInteraction(state);
			// Emit STATUS only on actual transitions, not on every render frame.
			if (state.status !== this.lastEmittedStatus) {
				this.lastEmittedStatus = state.status;
				this.onActionCallback?.({ type: "STATUS", payload: state.status });
			}
		});
	}

	mount(container: HTMLElement) {
		this.renderer.mount(container, this.gateway);
		this.interactionHandler.attach(container);
		this.renderer.render(this.store.getState());
	}

	unmount() {
		this.renderer.unmount();
		this.interactionHandler.detach();
	}

	destroy() {
		this.unmount();
		this.onActionCallback = undefined;
		this.onViewportChangeCallback = null;
	}

	getState(): { elements: CanvasElement[]; viewport: CanvasViewport } {
		return this.store.getSnapshot();
	}

	update(
		patch: Partial<{
			elements: CanvasElement[];
			viewport: CanvasViewport;
			context?: Partial<CanvasEngineContext>;
		}>,
	) {
		const state = this.store.getState();
		const storePatch: Partial<CanvasState> = {};

		if (patch.elements !== undefined) {
			const elements = patch.elements;
			if (
				state.elements.length !== elements.length ||
				!elements.every(
					(el, i) =>
						el.id === state.elements[i].id &&
						el.updatedAt === state.elements[i].updatedAt,
				)
			) {
				storePatch.elements = elements;
			}
		}

		if (patch.viewport !== undefined) storePatch.viewport = patch.viewport;
		if (patch.context !== undefined)
			Object.assign(storePatch, this.applyContextPatch(patch.context, state));

		if (Object.keys(storePatch).length > 0) this.store.update(storePatch);
	}

	updateContext(context: Partial<CanvasEngineContext>) {
		if (context.command === "EXPORT_SVG") {
			this.exportToSVG().then((svg) => {
				this.onActionCallback?.({ type: "EXPORT_RESULT", payload: svg });
			});
		}
		const patch = this.applyContextPatch(context, this.store.getState());
		if (Object.keys(patch).length > 0) this.store.update(patch);
	}

	/**
	 * Translates a partial CanvasEngineContext into a CanvasState patch and
	 * synchronously applies any side-effects that must be in lock-step with the
	 * state change (tool registration, cursor update).
	 */
	private applyContextPatch(
		context: Partial<CanvasEngineContext>,
		state: CanvasState,
	): Partial<CanvasState> {
		const patch: Partial<CanvasState> = {};
		if (context.activeNodeId !== undefined)
			patch.activeNodeId = context.activeNodeId;
		if (context.layoutMode !== undefined) patch.layoutMode = context.layoutMode;
		if (context.pageSize !== undefined) patch.pageSize = context.pageSize;
		if (context.penConfig !== undefined)
			patch.penConfig = { ...state.penConfig, ...context.penConfig };
		if (context.highlighterConfig !== undefined)
			patch.highlighterConfig = {
				...state.highlighterConfig,
				...context.highlighterConfig,
			};
		if (context.activeTool !== undefined) {
			patch.activeTool = context.activeTool;
			this.interactionManager.setActiveTool(context.activeTool);
			this.renderer.updateCursor(this.interactionManager.getCursor());
		}
		return patch;
	}

	onAction(callback: (action: { type: string; payload?: any }) => void) {
		this.onActionCallback = callback;
	}

	handleKeyDown(e: KeyboardEvent): boolean {
		return this.interactionHandler.handleKeyDown(e);
	}

	setRenderingPath(path: "SVG" | "WEBGPU") {
		const container = this.renderer.container;
		this.renderer.unmount();

		if (path === "WEBGPU") {
			this.renderer = new WebGPURenderer();
		} else {
			this.renderer = this.createSvgRenderer();
		}

		if (container) {
			this.mount(container);
		}
	}

	private createSvgRenderer(): SVGRenderer {
		return new SVGRenderer({
			onTextEdit: (id, newContent) => {
				const el = this.store.getState().elements.find((e) => e.id === id);
				if (el && el.metadata.content !== newContent) {
					this.store.emitCommand("UPDATE_ELEMENTS", [
						{
							id,
							changes: { metadata: { ...el.metadata, content: newContent } },
						},
					]);
				}
				this.store.update({ editingElementId: null });
			},
			onTextEditCancel: () => {
				this.store.update({ editingElementId: null });
			},
		});
	}

	async copySelection() {
		const state = this.store.getState();
		if (state.selectedElementIds.length === 0) return;
		const data = this.clipboardService.copySelection(
			state.selectedElementIds,
			state.elements,
		);
		try {
			await navigator.clipboard.writeText(data);
		} catch (e) {
			console.error("Failed to copy", e);
		}
	}

	async cutSelection() {
		await this.copySelection();
		const state = this.store.getState();
		if (state.selectedElementIds.length > 0) {
			this.store.dispatch({
				type: "DELETE_ELEMENTS",
				payload: state.selectedElementIds,
			});
		}
	}

	async pasteClipboard() {
		try {
			const text = await navigator.clipboard.readText();
			const commands = this.clipboardService.pasteClipboard(text);
			commands.forEach((cmd) => {
				this.store.emitCommand(cmd.type, cmd.payload);
			});
		} catch (e) {
			console.error("Failed to paste", e);
		}
	}

	async exportToSVG(): Promise<string> {
		return await this.gateway.exportSVG();
	}

	onStatusChange(
		callback: (status: "LOADING" | "READY" | "ERROR", message?: string) => void,
	): void {
		this.statusListeners.add(callback);
	}

	private reportStatus(
		status: "LOADING" | "READY" | "ERROR",
		message?: string,
	) {
		this.store.update({ status });
		this.statusListeners.forEach((l) => {
			l(status, message);
		});
	}

	private async syncToWasm(elements: CanvasElement[]) {
		await this.gateway.sync(elements);
	}
}
