import type { ElementFactory } from "engine-core";
import type { CanvasElement } from "../types";
import { ElementUtils } from "../utils/ElementUtils";

export class ClipboardService {
	constructor(private elementFactory: ElementFactory<CanvasElement>) {}

	copySelection(selectedIds: string[], elements: CanvasElement[]): string {
		const selectedElements = elements.filter((el) =>
			selectedIds.includes(el.id),
		);
		return JSON.stringify({
			version: "1.0",
			source: "spatial-notes",
			type: "elements",
			payload: selectedElements,
		});
	}

	/**
	 * Parse clipboard text and return new CanvasElements ready for dispatch.
	 * Each element gets a fresh ID from the factory (no ID collisions on
	 * repeated paste).
	 *
	 * @param text         Raw text from navigator.clipboard.readText().
	 * @param activeNodeId parentId assigned to every pasted element.
	 * @param pasteOrigin  When provided, the combined bounding-box center of all
	 *                     pasted elements is moved to this MM coordinate.
	 *                     When omitted, each element is offset by +10/+10 mm
	 *                     relative to its original position (classic paste).
	 */
	paste(
		text: string,
		activeNodeId: string,
		pasteOrigin?: { x: number; y: number },
	): CanvasElement[] {
		try {
			const data = JSON.parse(text);
			if (
				data?.source !== "spatial-notes" ||
				!Array.isArray(data.payload) ||
				data.payload.length === 0
			) {
				return [];
			}

			const rawItems = data.payload as Array<{
				type: string;
				metadata: Record<string, unknown>;
			}>;

			if (pasteOrigin !== undefined) {
				// Create elements at original positions first, then translate
				// their combined center to pasteOrigin in a second pass.
				const elements = rawItems.map((el) =>
					this.elementFactory(el.type, activeNodeId, { ...el.metadata }),
				);
				return this.recenterAt(elements, pasteOrigin);
			}

			// Default: nudge each element by +10/+10 mm.
			return rawItems.map((el) => {
				const metadata = ElementUtils.offsetMetadata(
					el.type,
					el.metadata,
					10,
					10,
				);
				return this.elementFactory(el.type, activeNodeId, metadata);
			});
		} catch {
			return [];
		}
	}

	/**
	 * Translate all elements so that their combined bounding-box center lands
	 * on `origin`.  Mutates a shallow copy of each element's metadata only.
	 */
	private recenterAt(
		elements: CanvasElement[],
		origin: { x: number; y: number },
	): CanvasElement[] {
		const bounds = ElementUtils.getCollectiveBounds(elements);
		if (!bounds) return elements;

		const dx = origin.x - (bounds.minX + bounds.maxX) / 2;
		const dy = origin.y - (bounds.minY + bounds.maxY) / 2;

		return elements.map((el) => ({
			...el,
			metadata: ElementUtils.offsetMetadata(el.type, el.metadata, dx, dy),
		}));
	}
}
