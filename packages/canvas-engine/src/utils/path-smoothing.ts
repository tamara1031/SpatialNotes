import { smooth_stroke_svg } from "canvas-wasm";

/**
 * Converts a sequence of points [x1, y1, x2, y2, ...] into a smooth SVG path.
 * Delegating entirely to Rust/Wasm for performance and consistency.
 */
export const pointsToCatmullRomPath = (points: number[]): string => {
	try {
		return smooth_stroke_svg(points);
	} catch (e) {
		console.warn("Wasm smoothing failed, returning raw points path");
		if (points.length < 4) return "";
		let d = `M ${points[0]} ${points[1]}`;
		for (let i = 2; i < points.length; i += 2) {
			d += ` L ${points[i]} ${points[i + 1]}`;
		}
		return d;
	}
};
