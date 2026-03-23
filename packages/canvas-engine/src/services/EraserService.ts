import type { WorkerGateway } from "../bridge/WorkerGateway";
import type { CanvasAction, CanvasStore } from "../store/CanvasStore";
import type { CanvasElement } from "../types";

export class EraserService {
	constructor(
		private store: CanvasStore,
		private gateway: WorkerGateway,
	) {}

	public async eraseAt(
		x: number,
		y: number,
		radius: number,
		isPrecision: boolean,
	): Promise<void> {
		// 1. Find elements intersecting with the eraser path/point
		const hitIds = await this.gateway.queryAt(x, y, radius);
		if (hitIds.length === 0) return;

		const state = this.store.getState();

		if (isPrecision) {
			await this.handlePrecisionErasure(hitIds, state, radius);
		} else {
			this.handleStandardErasure(hitIds, state);
		}
	}

	private handleStandardErasure(hitIds: string[], state: any): void {
		this.store.dispatch({ type: "DELETE_ELEMENTS", payload: hitIds });
	}

	private async handlePrecisionErasure(
		hitIds: string[],
		state: any,
		radius: number,
	): Promise<void> {
		const allUpdates: any[] = [];

		for (const id of hitIds) {
			const el = state.elements.find((e: CanvasElement) => e.id === id);

			if (el && el.type === "ELEMENT_STROKE") {
				const eraserPath = await this.gateway.getInteractionPoints();
				if (eraserPath.length >= 4) {
					const fragments = await this.gateway.partialErase(
						el,
						eraserPath,
						radius,
					);
					if (fragments) {
						const updates = [
							{ id: el.id, changes: { isDeleted: true } },
							...fragments.map((f: any) => ({
								id: f.id,
								changes: {
									type: f.data.type,
									parentId: f.parent_id,
									metadata: { ...f.data },
									isDeleted: false,
								},
							})),
						];
						allUpdates.push(...updates);
					}
				}
			} else {
				allUpdates.push({ id, changes: { isDeleted: true } });
			}
		}

		if (allUpdates.length > 0) {
			this.applyOptimisticPrecisionUpdates(state.elements, allUpdates);
		}
	}

	private applyOptimisticPrecisionUpdates(
		currentElements: CanvasElement[],
		updates: any[],
	): void {
		const deletedIds = updates
			.filter((u) => u.changes.isDeleted)
			.map((u) => u.id);
		const activeFragments = updates
			.filter((u) => !u.changes.isDeleted)
			.map(
				(u) =>
					({
						id: u.id,
						type: u.changes.type || "ELEMENT_STROKE",
						parentId: u.changes.parentId,
						metadata: { ...u.changes.metadata },
						updatedAt: Date.now(),
					}) as CanvasElement,
			);

		const actions: CanvasAction[] = [];
		if (deletedIds.length > 0) {
			actions.push({ type: "DELETE_ELEMENTS", payload: deletedIds });
		}
		activeFragments.forEach((frag) => {
			actions.push({ type: "CREATE_ELEMENT", payload: frag });
		});

		if (actions.length > 0) {
			this.store.dispatch({ type: "BATCH", payload: actions });
		}
	}
}
