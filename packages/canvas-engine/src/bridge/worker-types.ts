/**
 * Canonical types for responses from the WASM canvas worker.
 * Shared between WorkerGateway (producer) and all callers (consumers).
 */

/** Returned by the worker after a pointer-up that completed a stroke. */
export interface PointerUpResult {
	boundingBox: number[];
	points: number[];
	pressures: number[];
	tilt_xs: number[];
	tilt_ys: number[];
}

/** A stroke fragment produced by the WASM partial-erase operation. */
export interface WasmFragment {
	id: string;
	data: { type?: string; [key: string]: unknown };
	parent_id: string;
}
