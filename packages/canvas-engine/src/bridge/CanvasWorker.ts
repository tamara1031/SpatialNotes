import init, { CanvasEngine, init_engine } from "canvas-wasm";

let wasmInstance: any;
let engine: CanvasEngine;

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
				await engine.bindCanvas(payload.canvas);
				self.postMessage({ type: "DONE", id });
				break;

			case "UPSERT_ELEMENT":
				engine.upsertElement(payload.element);
				self.postMessage({ type: "DONE", id });
				break;

			case "REMOVE_ELEMENT":
				engine.removeElement(payload.id);
				self.postMessage({ type: "DONE", id });
				break;

			case "POINTER_DOWN":
				engine.pointerDown(
					payload.x,
					payload.y,
					payload.pressure || 0,
					payload.tiltX || 0,
					payload.tiltY || 0,
				);
				self.postMessage({ type: "DONE", id });
				break;

			case "POINTER_MOVE":
				engine.pointerMove(
					payload.x,
					payload.y,
					payload.pressure || 0,
					payload.tiltX || 0,
					payload.tiltY || 0,
				);
				self.postMessage({ type: "DONE", id });
				break;

			case "POINTER_UP": {
				const result = engine.pointerUp();
				self.postMessage({ type: "DONE", id, payload: result });
				break;
			}

			case "GET_ELEMENT_AT": {
				const elId = engine.queryEraser([payload.x, payload.y], 5); // Example radius
				self.postMessage({ type: "DONE", id, payload: elId });
				break;
			}

			case "SYNC":
				engine.clear();
				for (const el of payload.elements) {
					engine.upsertElement(el);
				}
				self.postMessage({ type: "DONE", id });
				break;

			case "EXPORT_SVG": {
				const svg = engine.exportSvg();
				self.postMessage({ type: "DONE", id, payload: svg });
				break;
			}

			case "GET_CURRENT_INTERACTION_POINTS":
				if (engine) {
					const ptr = engine.getInteractionPointsPtr();
					const len = engine.getInteractionPointsLen();
					// Create a copy of the f64 data to send to main thread
					const data = new Float64Array(
						wasmInstance.memory.buffer,
						ptr,
						len,
					).slice();
					self.postMessage({ type: "DONE", id, payload: Array.from(data) });
				}
				break;
			case "GET_CURRENT_STROKE_PATH":
				if (engine) {
					self.postMessage({
						type: "DONE",
						id,
						payload: engine.getCurrentStrokePath(),
					});
				}
				break;

			case "QUERY_AT": {
				const hitIds = engine.queryEraser(
					payload.interactionPoints || [],
					payload.radius,
				);
				// Note: Rust version of query_eraser takes (path, radius)
				// If it's a single point, we wrap it in a path
				self.postMessage({ type: "DONE", id, payload: hitIds });
				break;
			}

			case "PARTIAL_ERASE": {
				const fragments = engine.partialErase(
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
