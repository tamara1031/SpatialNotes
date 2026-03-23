import type { WorkerGateway } from "../bridge/WorkerGateway";
import type { CanvasRenderer } from "../render/Renderer";
import type { DrawingService } from "../services/DrawingService";
import type { EraserService } from "../services/EraserService";
import type { SelectionService } from "../services/SelectionService";
import type { CanvasStore } from "../store/CanvasStore";

export interface InteractionContext {
	store: CanvasStore;
	renderer: CanvasRenderer;
	gateway: WorkerGateway;

	services: {
		drawing: DrawingService;
		eraser: EraserService;
		selection: SelectionService;
	};

	// UI Helpers transferred to Engine/Manager
	updateCursor(): void;
}

export interface Tool {
	onPointerDown(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void> | void;
	onPointerMove(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void> | void;
	onPointerUp(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void> | void;
	onDoubleClick?(e: MouseEvent, ctx: InteractionContext): Promise<void> | void;
	getCursor(): string;
}
