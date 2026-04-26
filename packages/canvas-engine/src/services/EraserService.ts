import type { WorkerGateway } from "../bridge/WorkerGateway";
import type {
	CanvasAction,
	CanvasState,
	CanvasStore,
} from "../store/CanvasStore";
import type { CanvasElement } from "../types";

/** Shape of stroke fragments returned by the WASM partial-erase operation. */
interface WasmFragment {
	id: string;
	data: { type?: string; [key: string]: unknown };
	parent_id: string;
}

type PrecisionUpdate =
	| { id: string; changes: { isDeleted: true } }
	| {
			id: string;
			changes: {
				type: string;
				parentId: string;
				metadata: Record<string, unknown>;
				isDeleted: false;
			};
	  };

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
		const hitIds = await this.gateway.queryAt(x, y, radius);
		if (hitIds.length === 0) return;

		const state = this.store.getState();

		if (isPrecision) {
			await this.handlePrecisionErasure(hitIds, state, radius);
		} else {
			this.handleStandardErasure(hitIds);
		}
	}

	private handleStandardErasure(hitIds: string[]): void {
		this.store.dispatch({ type: "DELETE_ELEMENTS", payload: hitIds });
	}

	private async handlePrecisionErasure(
		hitIds: string[],
		state: CanvasState,
		radius: number,
	): Promise<void> {
		const allUpdates: PrecisionUpdate[] = [];

		for (const id of hitIds) {
			const el = state.elements.find((e: CanvasElement) => e.id === id);

			if (el && el.type === "ELEMENT_STROKE") {
				const eraserPath = await this.gateway.getInteractionPoints();
				if (eraserPath.length >= 4) {
					const fragments = (await this.gateway.partialErase(
						el,
						eraserPath,
						radius,
					)) as WasmFragment[];
					if (fragments) {
						const updates: PrecisionUpdate[] = [
							{ id: el.id, changes: { isDeleted: true } },
							...fragments.map(
								(f): PrecisionUpdate => ({
									id: f.id,
									changes: {
										type: f.data.type ?? "ELEMENT_STROKE",
										parentId: f.parent_id,
										metadata: { ...f.data },
										isDeleted: false,
									},
								}),
							),
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
		_currentElements: CanvasElement[],
		updates: PrecisionUpdate[],
	): void {
		const deletedIds = updates
			.filter((u) => u.changes.isDeleted)
			.map((u) => u.id);
		const activeFragments = updates
			.filter(
				(u): u is Extract<PrecisionUpdate, { changes: { isDeleted: false } }> =>
					!u.changes.isDeleted,
			)
			.map(
				(u): CanvasElement => ({
					id: u.id,
					type: u.changes.type,
					parentId: u.changes.parentId,
					metadata: { ...u.changes.metadata },
					updatedAt: Date.now(),
				}),
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
