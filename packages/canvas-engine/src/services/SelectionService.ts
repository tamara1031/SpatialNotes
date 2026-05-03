import type { WorkerGateway } from "../bridge/WorkerGateway";
import { getNumber, MetadataKey } from "../metadata/ElementMetadata";
import type { CanvasStore } from "../store/CanvasStore";
import { ElementUtils } from "../utils/ElementUtils";

export class SelectionService {
	constructor(
		private store: CanvasStore,
		private gateway: WorkerGateway,
	) {}

	public bringToFront(ids: string[]) {
		const state = this.store.getState();
		const unchanged = state.elements.filter((el) => !ids.includes(el.id));
		const maxZ = unchanged.reduce(
			(m, el) => Math.max(m, getNumber(el.metadata, MetadataKey.Z_INDEX)),
			0,
		);
		const updates = state.elements
			.filter((el) => ids.includes(el.id))
			.map((el, i) => ({
				id: el.id,
				changes: { metadata: { z_index: maxZ + i + 1 } },
			}));
		this.store.dispatch({ type: "UPDATE_ELEMENTS", payload: updates });
	}

	public sendToBack(ids: string[]) {
		const state = this.store.getState();
		const unchanged = state.elements.filter((el) => !ids.includes(el.id));
		const minZ = unchanged.reduce(
			(m, el) => Math.min(m, getNumber(el.metadata, MetadataKey.Z_INDEX)),
			0,
		);
		const updates = state.elements
			.filter((el) => ids.includes(el.id))
			.map((el, i) => ({
				id: el.id,
				changes: { metadata: { z_index: minZ - (ids.length - i) } },
			}));
		this.store.dispatch({ type: "UPDATE_ELEMENTS", payload: updates });
	}

	public moveElements(ids: string[], dx: number, dy: number) {
		const updates = ElementUtils.moveElements(
			this.store.getState().elements,
			ids,
			dx,
			dy,
		);
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
