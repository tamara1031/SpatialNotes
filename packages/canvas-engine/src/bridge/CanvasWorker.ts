import init, { CanvasEngine, init_engine } from "canvas-wasm";

let wasmInstance: { memory: WebAssembly.Memory } | undefined;
let engine: CanvasEngine | undefined;

/** Throws an Error (caught by the outer try/catch → ERROR reply) if INIT has not completed. */
function assertEngine(): CanvasEngine {
	if (!engine) throw new Error("Engine not initialized: send INIT first");
	return engine;
}

self.onmessage = async (e: MessageEvent) => {
	const { type, payload, id } = e.data;

	try {
		switch (type) {
			case "INIT":
				wasmInstance = await init();
				init_engine();
				engine = new CanvasEngine(payload.width, payload.height);
				self.postMessage({ type: "DONE", id });
				break;

			case "BIND_CANVAS":
				// payload.canvas is an OffscreenCanvas
				await assertEngine().bindCanvas(payload.canvas);
				self.postMessage({ type: "DONE", id });
				break;

			case "UPSERT_ELEMENT":
				assertEngine().upsertElement(payload.element);
				self.postMessage({ type: "DONE", id });
				break;

			case "REMOVE_ELEMENT":
				assertEngine().removeElement(payload.id);
				self.postMessage({ type: "DONE", id });
				break;

			case "POINTER_DOWN":
				assertEngine().pointerDown(
					payload.x,
					payload.y,
					payload.pressure || 0,
					payload.tiltX || 0,
					payload.tiltY || 0,
				);
				self.postMessage({ type: "DONE", id });
				break;

			case "POINTER_MOVE":
				assertEngine().pointerMove(
					payload.x,
					payload.y,
					payload.pressure || 0,
					payload.tiltX || 0,
					payload.tiltY || 0,
				);
				self.postMessage({ type: "DONE", id });
				break;

			case "POINTER_UP": {
				const result = assertEngine().pointerUp();
				self.postMessage({ type: "DONE", id, payload: result });
				break;
			}

			case "GET_ELEMENT_AT": {
				// queryEraser returns string[]; pick the closest hit or null.
				const hits = assertEngine().queryEraser(
					[payload.x, payload.y],
					payload.radius ?? 5,
				);
				self.postMessage({ type: "DONE", id, payload: hits[0] ?? null });
				break;
			}

			case "SYNC": {
				const eng = assertEngine();
				eng.clear();
				for (const el of payload.elements) {
					eng.upsertElement(el);
				}
				self.postMessage({ type: "DONE", id });
				break;
			}

			case "EXPORT_SVG": {
				const svg = assertEngine().exportSvg();
				self.postMessage({ type: "DONE", id, payload: svg });
				break;
			}

			case "GET_CURRENT_INTERACTION_POINTS": {
				const eng = assertEngine();
				if (!wasmInstance) throw new Error("Wasm instance not available");
				const ptr = eng.getInteractionPointsPtr();
				const len = eng.getInteractionPointsLen();
				// Create a copy of the f64 data to send to main thread
				const data = new Float64Array(
					wasmInstance.memory.buffer,
					ptr,
					len,
				).slice();
				self.postMessage({ type: "DONE", id, payload: Array.from(data) });
				break;
			}

			case "GET_CURRENT_STROKE_PATH":
				self.postMessage({
					type: "DONE",
					id,
					payload: assertEngine().getCurrentStrokePath(),
				});
				break;

			case "QUERY_AT": {
				// query_eraser expects a flat point path [x0, y0, x1, y1, ...].
				// For a single-point hit-test we synthesise a 1-point path.
				const hitIds = assertEngine().queryEraser(
					[payload.x, payload.y],
					payload.radius,
				);
				self.postMessage({ type: "DONE", id, payload: hitIds });
				break;
			}

			case "PARTIAL_ERASE": {
				const fragments = assertEngine().partialErase(
					payload.element,
					payload.eraserPath,
					payload.radius,
				);
				self.postMessage({ type: "DONE", id, payload: fragments });
				break;
			}
		}
	} catch (error) {
		self.postMessage({ type: "ERROR", id, error: (error as Error).message });
	}
};
