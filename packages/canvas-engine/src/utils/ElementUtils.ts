import type { CanvasElement } from "../types";

export interface Bounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export class ElementUtils {
	/**
	 * Calculates the bounding box for a given element.
	 */
	static getBounds(el: CanvasElement): Bounds {
		if (el.type === "ELEMENT_STROKE") {
			const points = el.metadata.points as number[];
			if (!points || points.length < 2)
				return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

			let minX = points[0],
				minY = points[1],
				maxX = points[0],
				maxY = points[1];
			for (let i = 0; i < points.length; i += 2) {
				minX = Math.min(minX, points[i]);
				minY = Math.min(minY, points[i + 1]);
				maxX = Math.max(maxX, points[i]);
				maxY = Math.max(maxY, points[i + 1]);
			}
			return { minX, minY, maxX, maxY };
		} else {
			const minX = (el.metadata.min_x as number) || 0;
			const minY = (el.metadata.min_y as number) || 0;
			const maxX =
				(el.metadata.max_x as number) ||
				minX + ((el.metadata.width as number) || 60);
			const maxY =
				(el.metadata.max_y as number) ||
				minY + ((el.metadata.height as number) || 45);
			return { minX, minY, maxX, maxY };
		}
	}

	/**
	 * Applies a delta (dx, dy) to a list of elements.
	 * Returns a list of updates ({ id, changes }).
	 */
	static moveElements(
		elements: CanvasElement[],
		ids: string[],
		dx: number,
		dy: number,
	) {
		return ids
			.map((id) => {
				const el = elements.find((e) => e.id === id);
				if (!el) return null;

				const changes: any = { metadata: { ...el.metadata } };
				if (el.type === "ELEMENT_STROKE") {
					const pts = (el.metadata.points as number[]).slice();
					for (let i = 0; i < pts.length; i += 2) {
						pts[i] += dx;
						pts[i + 1] += dy;
					}
					changes.metadata.points = pts;
				} else {
					if (changes.metadata.min_x !== undefined)
						changes.metadata.min_x += dx;
					if (changes.metadata.min_y !== undefined)
						changes.metadata.min_y += dy;
					if (changes.metadata.max_x !== undefined)
						changes.metadata.max_x += dx;
					if (changes.metadata.max_y !== undefined)
						changes.metadata.max_y += dy;
				}
				return { id, changes };
			})
			.filter((u): u is { id: string; changes: any } => u !== null);
	}

	private static isPointNearPath(
		x: number,
		y: number,
		path: number[],
		threshold: number,
	): boolean {
		// ... (remaining if needed, but likely not)
		return false;
	}

	/**
	 * Clips coordinates to the paper boundary based on layout mode.
	 */
	static clipCoords(
		x: number,
		y: number,
		layoutMode: string,
		pageSize: { width: number; height: number },
	): { x: number; y: number } {
		if (layoutMode === "INFINITE") return { x, y };
		const maxX = pageSize.width;
		return {
			x: Math.max(0, Math.min(x, maxX)),
			y: Math.max(0, Math.min(y, pageSize.height)),
		};
	}

	/**
	 * Checks if a point is within the paper boundary.
	 */
	static isInBounds(
		x: number,
		y: number,
		layoutMode: string,
		pageSize: { width: number; height: number },
	): boolean {
		if (layoutMode === "INFINITE") return true;
		const maxX = pageSize.width;
		return x >= 0 && x <= maxX && y >= 0 && y <= pageSize.height;
	}
}
