import type { InteractionContext, Tool } from "./Tool";

export class PanningTool implements Tool {
	getCursor(): string {
		return "grabbing";
	}

	onPointerDown(e: PointerEvent, ctx: InteractionContext): void {
		ctx.store.update({
			isPanning: true,
			lastPanPos: { x: e.clientX, y: e.clientY },
		});
	}

	onPointerMove(e: PointerEvent, ctx: InteractionContext): void {
		const state = ctx.store.getState();
		if (state.isPanning && state.lastPanPos) {
			const dx = e.clientX - state.lastPanPos.x;
			const dy = e.clientY - state.lastPanPos.y;

			// Fix invalid ctx.dispatch call: use store.update directly
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

	onPointerUp(e: PointerEvent, ctx: InteractionContext): void {
		ctx.store.update({ isPanning: false, lastPanPos: null });
	}
}
