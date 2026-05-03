/** Canonical metadata key names shared across all element types. */
export const MetadataKey = {
	// Common
	Z_INDEX: "z_index",
	// Stroke
	POINTS: "points",
	COLOR: "color",
	WIDTH: "width",
	// Shape / image bounding box
	MIN_X: "min_x",
	MIN_Y: "min_y",
	MAX_X: "max_x",
	MAX_Y: "max_y",
	HEIGHT: "height",
} as const;

export type MetadataKey = (typeof MetadataKey)[keyof typeof MetadataKey];

/**
 * Safely read a numeric metadata field.
 * Returns `fallback` (default 0) when the key is absent or not a number,
 * and emits a console.warn so bugs surface in development without crashing.
 */
export function getNumber(
	meta: Record<string, unknown>,
	key: string,
	fallback = 0,
): number {
	const v = meta[key];
	if (v === undefined || v === null) return fallback;
	if (typeof v === "number") return v;
	console.warn(
		`ElementMetadata: expected number for "${key}", got ${typeof v}`,
	);
	return fallback;
}

/**
 * Safely read a flat number-array metadata field (e.g. stroke points).
 * Returns an empty array when the key is absent or not an array of numbers.
 */
export function getNumberArray(
	meta: Record<string, unknown>,
	key: string,
): number[] {
	const v = meta[key];
	if (!Array.isArray(v)) {
		if (v !== undefined && v !== null) {
			console.warn(
				`ElementMetadata: expected number[] for "${key}", got ${typeof v}`,
			);
		}
		return [];
	}
	return v as number[];
}
