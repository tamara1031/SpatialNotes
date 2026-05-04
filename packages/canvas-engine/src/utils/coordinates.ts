/** Physical pixels per millimetre at 96 DPI standard screen density. */
export const PIXELS_PER_MM = 3.78;

/**
 * Convert a container-relative pixel offset to canvas millimetres.
 *
 * The formula inverts the viewport transform:
 *   mm = (pixelOffset - pan) / (scale * PIXELS_PER_MM)
 */
export function clientPixelToMm(
	pixelOffset: number,
	pan: number,
	scale: number,
): number {
	return (pixelOffset - pan) / (scale * PIXELS_PER_MM);
}

/**
 * Convert a canvas-MM coordinate back to a container-relative CSS pixel offset.
 *
 *   pixel = mm * scale * PIXELS_PER_MM + pan
 */
export function mmToClientPixel(
	mm: number,
	pan: number,
	scale: number,
): number {
	return mm * scale * PIXELS_PER_MM + pan;
}
