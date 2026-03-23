import type { WorkerGateway } from "../bridge/WorkerGateway";
import type { CanvasState } from "../store/CanvasStore";

export interface CanvasRenderer {
	mount(container: HTMLElement, gateway: WorkerGateway): void;
	unmount(): void;
	render(state: CanvasState): void;
	renderInteraction(state: CanvasState): void;
	getMmCoords(e: PointerEvent | MouseEvent): { x: number; y: number };
	updateCursor(cursor: string): void;
	exportToSVG(state: CanvasState): Promise<string>;
}
