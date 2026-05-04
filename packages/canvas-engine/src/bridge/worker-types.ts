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

/**
 * Data payload for a stroke fragment produced by partial-erase.
 * All fields mirror the metadata written by the Rust engine so that
 * the fragment can be spread directly into CanvasElement.metadata.
 */
export interface StrokeFragmentData {
	type: "ELEMENT_STROKE";
	points: number[];
	pressures?: number[];
	tilt_xs?: number[];
	tilt_ys?: number[];
	color?: string;
	width?: number;
}

/**
 * Discriminated union of all fragment data shapes the WASM engine can
 * return.  New element types produced by partial-erase should be added
 * here as additional union members.
 */
export type WasmFragmentData = StrokeFragmentData;

/** A stroke fragment produced by the WASM partial-erase operation. */
export interface WasmFragment {
	id: string;
	data: WasmFragmentData;
	parent_id: string;
}
