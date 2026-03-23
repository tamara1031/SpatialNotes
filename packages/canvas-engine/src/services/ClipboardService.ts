import type { CanvasElement } from "../types";

export class ClipboardService {
	public copySelection(
		selectedIds: string[],
		elements: CanvasElement[],
	): string {
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

	public pasteClipboard(text: string): { type: string; payload: any }[] {
		try {
			const data = JSON.parse(text);
			if (data?.source === "spatial-notes" && Array.isArray(data.payload)) {
				return data.payload.map((el: any) => {
					const dx = 10,
						dy = 10;
					const newMetadata = { ...el.metadata };
					if (el.type === "ELEMENT_STROKE") {
						const points = el.metadata.points as number[];
						if (points)
							newMetadata.points = points.map((p: number, i: number) =>
								i % 2 === 0 ? p + dx : p + dy,
							);
					} else {
						if (newMetadata.min_x !== undefined) newMetadata.min_x += dx;
						if (newMetadata.min_y !== undefined) newMetadata.min_y += dy;
						if (newMetadata.max_x !== undefined) newMetadata.max_x += dx;
						if (newMetadata.max_y !== undefined) newMetadata.max_y += dy;
					}
					return {
						type: "CREATE",
						payload: { type: el.type, metadata: newMetadata },
					};
				});
			}
		} catch (e) {
			console.error("Failed to parse clipboard data", e);
		}
		return [];
	}
}
