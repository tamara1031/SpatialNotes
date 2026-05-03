import type { ElementFactory } from "engine-core";
import type { CanvasElement } from "../types";

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
	 * Parse clipboard text and return a list of new CanvasElements ready to be
	 * dispatched as CREATE_ELEMENT actions.  Each element receives a fresh ID
	 * from the injected factory so that repeated pastes never collide.
	 *
	 * @param text        Raw text from navigator.clipboard.readText().
	 * @param activeNodeId The parentId to assign to every pasted element.
	 */
	paste(text: string, activeNodeId: string): CanvasElement[] {
		try {
			const data = JSON.parse(text);
			if (
				data?.source !== "spatial-notes" ||
				!Array.isArray(data.payload) ||
				data.payload.length === 0
			) {
				return [];
			}

			return (data.payload as Array<{ type: string; metadata: Record<string, unknown> }>).map(
				(el) => {
					const metadata = this.offsetMetadata(el.type, el.metadata, 10, 10);
					return this.elementFactory(el.type, activeNodeId, metadata);
				},
			);
		} catch {
			return [];
		}
	}

	private offsetMetadata(
		type: string,
		metadata: Record<string, unknown>,
		dx: number,
		dy: number,
	): Record<string, unknown> {
		const m = { ...metadata };
		if (type === "ELEMENT_STROKE") {
			const points = m.points as number[] | undefined;
			if (points) {
				m.points = points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy));
			}
		} else {
			if (m.min_x !== undefined) m.min_x = (m.min_x as number) + dx;
			if (m.min_y !== undefined) m.min_y = (m.min_y as number) + dy;
			if (m.max_x !== undefined) m.max_x = (m.max_x as number) + dx;
			if (m.max_y !== undefined) m.max_y = (m.max_y as number) + dy;
		}
		return m;
	}
}
