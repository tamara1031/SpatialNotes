import type { ElementFactory } from "engine-core";
import type { CanvasStore } from "../store/CanvasStore";
import type { CanvasElement } from "../types";

export class DrawingService {
	constructor(
		private store: CanvasStore,
		private elementFactory: ElementFactory,
	) {}

	public createStroke(
		points: number[],
		config: { color: string; width: number },
		extraMetadata: any = {},
	): void {
		const state = this.store.getState();
		const parentId = state.activeNodeId || "root";
		console.log(
			`[DrawingService] Creating stroke for parentId: ${parentId}, activeNodeId: ${state.activeNodeId}`,
		);

		const stroke = this.elementFactory("ELEMENT_STROKE", parentId, {
			points,
			...config,
			...extraMetadata,
		}) as CanvasElement;

		this.store.dispatch({ type: "CREATE_ELEMENT", payload: stroke });
	}
}
