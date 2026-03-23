import { CanvasTool } from "../types";
import type { InteractionContext, Tool } from "./Tool";

export class EraserTool implements Tool {
	async onPointerDown(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	) {
		ctx.store.update({ isInteracting: true });
		await this.eraseAt(coords.x, coords.y, ctx);
	}

	async onPointerMove(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	) {
		if (!ctx.store.getState().isInteracting) return;
		await this.eraseAt(coords.x, coords.y, ctx);
	}

	async onPointerUp(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	) {
		// Finalize worker interaction
		await ctx.gateway.pointerUp();
		ctx.store.update({ isInteracting: false });
	}

	private async eraseAt(x: number, y: number, ctx: InteractionContext) {
		const state = ctx.store.getState();
		const isPrecision = state.activeTool === CanvasTool.ERASER_PRECISION;
		const radius = isPrecision ? 1.5 : 3.0;

		await ctx.services.eraser.eraseAt(x, y, radius, isPrecision);
	}

	getCursor() {
		return "crosshair";
	}
}
