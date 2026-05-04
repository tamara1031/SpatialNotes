import type { InteractionContext } from "./Tool";
import { AbstractTool } from "./AbstractTool";

export class PanningTool extends AbstractTool {
	getCursor(): string {
		return "grabbing";
	}

	protected async _onPointerDown(
		e: PointerEvent,
		ctx: InteractionContext,
		_coords: { x: number; y: number },
	): Promise<void> {
		ctx.store.update({
			isPanning: true,
			lastPanPos: { x: e.clientX, y: e.clientY },
		});
	}

	protected async _onPointerMove(
		e: PointerEvent,
		ctx: InteractionContext,
		_coords: { x: number; y: number },
	): Promise<void> {
		const state = ctx.store.getState();
		if (state.isPanning && state.lastPanPos) {
			const dx = e.clientX - state.lastPanPos.x;
			const dy = e.clientY - state.lastPanPos.y;

			const currentPan = state.viewport.pan;
			ctx.store.update({
				viewport: {
					...state.viewport,
					pan: { x: currentPan.x + dx, y: currentPan.y + dy },
				},
				lastPanPos: { x: e.clientX, y: e.clientY },
			});
		}
	}

	protected async _onPointerUp(
		_e: PointerEvent,
		ctx: InteractionContext,
		_coords: { x: number; y: number },
	): Promise<void> {
		ctx.store.update({ isPanning: false, lastPanPos: null });
	}
}
