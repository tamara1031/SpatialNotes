import { WorkerRpcClient } from "engine-core";
import type { CanvasElement } from "../types";

export class WorkerGateway extends WorkerRpcClient {
	constructor() {
		super(new URL("./CanvasWorker.ts", import.meta.url));
	}

	// --- Lifecycle ---
	async init(width: number, height: number): Promise<void> {
		return this.request("INIT", { width, height });
	}

	async bindCanvas(canvas: OffscreenCanvas): Promise<void> {
		return this.request("BIND_CANVAS", { canvas }, [canvas]);
	}

	// --- Interaction ---
	async pointerDown(
		x: number,
		y: number,
		pressure?: number,
		tiltX?: number,
		tiltY?: number,
	): Promise<void> {
		return this.request("POINTER_DOWN", { x, y, pressure, tiltX, tiltY });
	}

	async pointerMove(
		x: number,
		y: number,
		pressure?: number,
		tiltX?: number,
		tiltY?: number,
	): Promise<void> {
		return this.request("POINTER_MOVE", { x, y, pressure, tiltX, tiltY });
	}

	async pointerUp(): Promise<unknown> {
		return this.request("POINTER_UP");
	}

	// --- Data Synchronization ---
	async sync(elements: CanvasElement[]): Promise<void> {
		return this.request("SYNC", { elements });
	}

	async upsertElement(element: CanvasElement): Promise<void> {
		return this.request("UPSERT_ELEMENT", { element });
	}

	async removeElement(id: string): Promise<void> {
		return this.request("REMOVE_ELEMENT", { id });
	}

	// --- Queries ---
	async queryAt(x: number, y: number, radius: number): Promise<string[]> {
		return this.request<string[]>("QUERY_AT", { x, y, radius });
	}

	async getElementAt(x: number, y: number): Promise<string | null> {
		return this.request<string | null>("GET_ELEMENT_AT", { x, y });
	}

	// --- Performance & Debugging ---
	async getInteractionPoints(): Promise<number[]> {
		return this.request<number[]>("GET_CURRENT_INTERACTION_POINTS");
	}

	async getStrokePath(): Promise<string> {
		return this.request<string>("GET_CURRENT_STROKE_PATH");
	}

	// --- Specialized Operations ---
	async partialErase(
		element: CanvasElement,
		eraserPath: unknown,
		radius: number,
	): Promise<unknown[]> {
		return this.request<unknown[]>("PARTIAL_ERASE", {
			element,
			eraserPath,
			radius,
		});
	}

	async exportSVG(): Promise<string> {
		return this.request<string>("EXPORT_SVG");
	}
}
