/** Stub for canvas-wasm in test environments (no Rust/WASM build required). */
export function smooth_stroke_svg(points: number[]): string {
	if (points.length < 4) return "";
	let d = `M ${points[0]} ${points[1]}`;
	for (let i = 2; i < points.length; i += 2) {
		d += ` L ${points[i]} ${points[i + 1]}`;
	}
	return d;
}
