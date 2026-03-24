import type { CanvasElement } from "../types";

export class WorkerGateway {
	private worker?: Worker;
	private nextId = 0;
	private pendingRequests = new Map<
		number,
		{ resolve: (val: any) => void; reject: (err: any) => void }
	>();

	constructor() {
		if (typeof Worker !== "undefined") {
			// In Vite, this URL pattern is used for workers
			this.worker = new Worker(new URL("./CanvasWorker.ts", import.meta.url), {
				type: "module",
			});
			this.worker.onmessage = this.handleMessage.bind(this);
		}
	}

	private handleMessage(e: MessageEvent) {
		const { type, id, payload, error } = e.data;
		const request = this.pendingRequests.get(id);
		if (!request) return;

		if (type === "ERROR") {
			request.reject(new Error(error));
		} else {
			request.resolve(payload);
		}
		this.pendingRequests.delete(id);
	}

	private request(
		type: string,
		payload?: any,
		transfer?: Transferable[],
	): Promise<any> {
		if (!this.worker) {
			return Promise.resolve(); // No-op in SSR
		}
		const id = this.nextId++;
		return new Promise((resolve, reject) => {
			this.pendingRequests.set(id, { resolve, reject });
			this.worker?.postMessage({ type, payload, id }, transfer || []);
		});
	}

	// --- Lifecycle ---
	async init(width: number, height: number): Promise<void> {
		return this.request("INIT", { width, height });
	}

	async bindCanvas(canvas: OffscreenCanvas): Promise<void> {
		return this.request("BIND_CANVAS", { canvas }, [canvas]);
	}

	terminate(): void {
		this.worker?.terminate();
		this.worker = undefined;
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

	async pointerUp(): Promise<any> {
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
		return this.request("QUERY_AT", { x, y, radius });
	}

	async getElementAt(x: number, y: number): Promise<string | null> {
		return this.request("GET_ELEMENT_AT", { x, y });
	}

	// --- Performance & Debugging ---
	async getInteractionPoints(): Promise<number[]> {
		return this.request("GET_CURRENT_INTERACTION_POINTS");
	}

	async getStrokePath(): Promise<string> {
		return this.request("GET_CURRENT_STROKE_PATH");
	}

	// --- Specialized Operations ---
	async partialErase(
		element: CanvasElement,
		eraserPath: any,
		radius: number,
	): Promise<any[]> {
		return this.request("PARTIAL_ERASE", { element, eraserPath, radius });
	}

	async exportSVG(): Promise<string> {
		return this.request("EXPORT_SVG");
	}
}
