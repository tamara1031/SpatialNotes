import {
	getNumber,
	getNumberArray,
	MetadataKey,
} from "../metadata/ElementMetadata";
import type { CanvasElement, CanvasLayoutMode } from "../types";

export interface Bounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export const ElementUtils = {
	getBounds(el: CanvasElement): Bounds {
		if (el.type === "ELEMENT_STROKE") {
			const points = getNumberArray(el.metadata, MetadataKey.POINTS);
			if (points.length < 2) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

			let minX = points[0];
			let minY = points[1];
			let maxX = points[0];
			let maxY = points[1];
			for (let i = 0; i < points.length; i += 2) {
				minX = Math.min(minX, points[i]);
				minY = Math.min(minY, points[i + 1]);
				maxX = Math.max(maxX, points[i]);
				maxY = Math.max(maxY, points[i + 1]);
			}
			return { minX, minY, maxX, maxY };
		}
		const minX = getNumber(el.metadata, MetadataKey.MIN_X);
		const minY = getNumber(el.metadata, MetadataKey.MIN_Y);
		const maxX =
			getNumber(el.metadata, MetadataKey.MAX_X) ||
			minX + (getNumber(el.metadata, MetadataKey.WIDTH) || 60);
		const maxY =
			getNumber(el.metadata, MetadataKey.MAX_Y) ||
			minY + (getNumber(el.metadata, MetadataKey.HEIGHT) || 45);
		return { minX, minY, maxX, maxY };
	},

	/**
	 * Translates element metadata by (dx, dy).
	 * Handles ELEMENT_STROKE (shifts the flat points array) and all other types
	 * (shifts min_x / min_y / max_x / max_y bounding-box fields).
	 * Returns a shallow copy — the original metadata object is never mutated.
	 */
	offsetMetadata(
		type: string,
		metadata: Record<string, unknown>,
		dx: number,
		dy: number,
	): Record<string, unknown> {
		const m = { ...metadata };
		if (type === "ELEMENT_STROKE") {
			const pts = getNumberArray(m, MetadataKey.POINTS);
			if (pts.length > 0) {
				m[MetadataKey.POINTS] = pts.map((p, i) =>
					i % 2 === 0 ? p + dx : p + dy,
				);
			}
		} else {
			if (m[MetadataKey.MIN_X] !== undefined)
				m[MetadataKey.MIN_X] = getNumber(m, MetadataKey.MIN_X) + dx;
			if (m[MetadataKey.MIN_Y] !== undefined)
				m[MetadataKey.MIN_Y] = getNumber(m, MetadataKey.MIN_Y) + dy;
			if (m[MetadataKey.MAX_X] !== undefined)
				m[MetadataKey.MAX_X] = getNumber(m, MetadataKey.MAX_X) + dx;
			if (m[MetadataKey.MAX_Y] !== undefined)
				m[MetadataKey.MAX_Y] = getNumber(m, MetadataKey.MAX_Y) + dy;
		}
		return m;
	},

	moveElements(
		elements: CanvasElement[],
		ids: string[],
		dx: number,
		dy: number,
	): { id: string; changes: { metadata: Record<string, unknown> } }[] {
		return ids
			.map((id) => {
				const el = elements.find((e) => e.id === id);
				if (!el) return null;
				return {
					id,
					changes: {
						metadata: ElementUtils.offsetMetadata(el.type, el.metadata, dx, dy),
					},
				};
			})
			.filter(
				(
					u,
				): u is {
					id: string;
					changes: { metadata: Record<string, unknown> };
				} => u !== null,
			);
	},

	/**
	 * Clips coordinates to the paper boundary based on layout mode.
	 */
	clipCoords(
		x: number,
		y: number,
		layoutMode: CanvasLayoutMode,
		pageSize: { width: number; height: number },
	): { x: number; y: number } {
		if (layoutMode === "INFINITE") return { x, y };
		const maxX = pageSize.width;
		return {
			x: Math.max(0, Math.min(x, maxX)),
			y: Math.max(0, Math.min(y, pageSize.height)),
		};
	},

	/**
	 * Checks if a point is within the paper boundary.
	 */
	isInBounds(
		x: number,
		y: number,
		layoutMode: CanvasLayoutMode,
		pageSize: { width: number; height: number },
	): boolean {
		if (layoutMode === "INFINITE") return true;
		const maxX = pageSize.width;
		return x >= 0 && x <= maxX && y >= 0 && y <= pageSize.height;
	},
};
