import type { WorkerGateway } from "../bridge/WorkerGateway";
import type { CanvasState } from "../store/CanvasStore";
import type { CanvasRenderer } from "./Renderer";

export class WebGPURenderer implements CanvasRenderer {
	private canvas: HTMLCanvasElement | null = null;
	private gateway: WorkerGateway | null = null;

	mount(container: HTMLElement, gateway: WorkerGateway) {
		this.gateway = gateway;
		this.canvas = document.createElement("canvas");
		this.canvas.style.width = "100%";
		this.canvas.style.height = "100%";
		this.canvas.style.display = "block";
		container.appendChild(this.canvas);

		// Sync initial size
		const rect = container.getBoundingClientRect();
		this.canvas.width = rect.width * window.devicePixelRatio;
		this.canvas.height = rect.height * window.devicePixelRatio;

		// Bind to WASM via WorkerGateway (transfers control)
		const offscreen = this.canvas.transferControlToOffscreen();
		this.gateway.bindCanvas(offscreen).catch((err) => {
			console.error("Failed to bind WebGPU canvas", err);
		});
	}

	unmount() {
		if (this.canvas && this.canvas.parentElement) {
			this.canvas.parentElement.removeChild(this.canvas);
		}
		this.canvas = null;
		this.gateway = null;
	}

	render(state: CanvasState) {
		// In the final version, this will call wasmEngine.render()
	}

	renderInteraction(state: CanvasState) {
		// Interaction rendering
	}

	getMmCoords(e: PointerEvent | MouseEvent): { x: number; y: number } {
		if (!this.canvas) return { x: 0, y: 0 };
		const rect = this.canvas.getBoundingClientRect();
		const physicalX = e.clientX - rect.left;
		const physicalY = e.clientY - rect.top;

		return { x: physicalX, y: physicalY };
	}

	updateCursor(cursor: string) {
		if (this.canvas) {
			this.canvas.style.cursor = cursor;
		}
	}

	async exportToSVG(state: CanvasState): Promise<string> {
		return "";
	}
}
