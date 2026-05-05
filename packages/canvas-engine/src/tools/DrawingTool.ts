import { CanvasTool } from "../types";
import { ElementUtils } from "../utils/ElementUtils";
import { AbstractTool } from "./AbstractTool";
import type { InteractionContext } from "./Tool";

export class DrawingTool extends AbstractTool {
	protected async _onPointerDown(
		_e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void> {
		const state = ctx.store.getState();

		if (
			!ElementUtils.isInBounds(
				coords.x,
				coords.y,
				state.layoutMode,
				state.pageSize,
			)
		) {
			return;
		}

		ctx.store.update({ isInteracting: true });
	}

	protected async _onPointerMove(
		_e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void> {
		const state = ctx.store.getState();
		if (!state.isInteracting) return;

		if (
			!ElementUtils.isInBounds(
				coords.x,
				coords.y,
				state.layoutMode,
				state.pageSize,
			)
		) {
			return;
		}
	}

	protected async _onPointerUp(
		_e: PointerEvent,
		ctx: InteractionContext,
		_coords: { x: number; y: number },
	): Promise<void> {
		const state = ctx.store.getState();
		if (!state.isInteracting) return;

		// Finalize stroke in worker and get results
		const result = await ctx.gateway.pointerUp();
		if (result?.boundingBox) {
			const state = ctx.store.getState();
			const config =
				state.activeTool === CanvasTool.HIGHLIGHTER
					? state.highlighterConfig
					: state.penConfig;

			ctx.services.drawing.createStroke(result.points, config, {
				pressures: result.pressures,
				tilt_xs: result.tilt_xs,
				tilt_ys: result.tilt_ys,
			});
		}

		ctx.store.update({ isInteracting: false });
	}

	getCursor() {
		return "crosshair";
	}
}
