import type { WorkerGateway } from "../bridge/WorkerGateway";
import type { CanvasStore } from "../store/CanvasStore";

export class SelectionService {
	constructor(
		private store: CanvasStore,
		private gateway: WorkerGateway,
	) {}

	public bringToFront(ids: string[]) {
		const state = this.store.getState();
		const elementsToMove = state.elements.filter((el) => ids.includes(el.id));
		const unchanged = state.elements.filter((el) => !ids.includes(el.id));
		const nextElements = [...unchanged, ...elementsToMove];

		this.store.update({ elements: nextElements });
		this.store.emitCommand(
			"UPDATE_ELEMENTS",
			elementsToMove.map((el) => ({ id: el.id, changes: {} })),
		);
	}

	public sendToBack(ids: string[]) {
		const state = this.store.getState();
		const elementsToMove = state.elements.filter((el) => ids.includes(el.id));
		const unchanged = state.elements.filter((el) => !ids.includes(el.id));
		const nextElements = [...elementsToMove, ...unchanged];

		this.store.update({ elements: nextElements });
		this.store.emitCommand(
			"UPDATE_ELEMENTS",
			elementsToMove.map((el) => ({ id: el.id, changes: {} })),
		);
	}

	public moveElements(ids: string[], dx: number, dy: number) {
		const updates = ids
			.map((id) => {
				const el = this.store.getState().elements.find((e) => e.id === id);
				if (!el) return null;
				return {
					id,
					changes: {
						metadata: {
							...el.metadata,
							x: (el.metadata.x || 0) + dx,
							y: (el.metadata.y || 0) + dy,
						},
					},
				};
			})
			.filter(Boolean) as any[];

		this.store.dispatch({ type: "UPDATE_ELEMENTS", payload: updates });
	}

	public selectArea(
		minX: number,
		minY: number,
		maxX: number,
		maxY: number,
	): Promise<string[]> {
		// Query the worker for elements in the specified area
		return this.gateway.queryAt(
			(minX + maxX) / 2,
			(minY + maxY) / 2,
			Math.max(maxX - minX, maxY - minY) / 2,
		);
	}
}
