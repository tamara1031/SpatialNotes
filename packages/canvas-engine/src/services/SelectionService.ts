import type { WorkerGateway } from "../bridge/WorkerGateway";
import { getNumber, MetadataKey } from "../metadata/ElementMetadata";
import type { CanvasStore } from "../store/CanvasStore";
import type { Bounds } from "../utils/ElementUtils";
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

	public async selectArea(
		minX: number,
		minY: number,
		maxX: number,
		maxY: number,
	): Promise<string[]> {
		const cx = (minX + maxX) / 2;
		const cy = (minY + maxY) / 2;
		// Half-diagonal is the tightest bounding-circle radius: it guarantees
		// every element that intersects the rectangle is returned by the
		// circular spatial index query (max(w,h)/2 misses corners).
		const w = maxX - minX;
		const h = maxY - minY;
		const halfDiag = Math.sqrt(w * w + h * h) / 2;

		const candidates = await this.gateway.queryAt(cx, cy, halfDiag);

		// Post-filter: discard elements whose bounds fall entirely outside the
		// selection rectangle (the circular query over-selects the corner zones).
		const rect: Bounds = { minX, minY, maxX, maxY };
		const elements = this.store.getState().elements;
		return candidates.filter((id) => {
			const el = elements.find((e) => e.id === id);
			if (!el) return false;
			const b = ElementUtils.getBounds(el);
			return (
				b.maxX >= rect.minX &&
				b.minX <= rect.maxX &&
				b.maxY >= rect.minY &&
				b.minY <= rect.maxY
			);
		});
	}
}
