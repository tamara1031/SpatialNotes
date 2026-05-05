import { CanvasTool } from "../types";
import { AbstractTool } from "./AbstractTool";
import type { InteractionContext } from "./Tool";

export class EraserTool extends AbstractTool {
	protected async _onPointerDown(
		_e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void> {
		ctx.store.update({ isInteracting: true });
		await this.eraseAt(coords.x, coords.y, ctx);
	}

	protected async _onPointerMove(
		_e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void> {
		if (!ctx.store.getState().isInteracting) return;
		await this.eraseAt(coords.x, coords.y, ctx);
	}

	protected async _onPointerUp(
		_e: PointerEvent,
		ctx: InteractionContext,
		_coords: { x: number; y: number },
	): Promise<void> {
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
