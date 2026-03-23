import { CanvasTool } from "../types";
import { ElementUtils } from "../utils/ElementUtils";
import type { InteractionContext, Tool } from "./Tool";

export class DrawingTool implements Tool {
	async onPointerDown(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	) {
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

	async onPointerMove(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	) {
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

	async onPointerUp(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	) {
		const state = ctx.store.getState();
		if (!state.isInteracting) return;

		// Finalize stroke in worker and get results
		const result = await ctx.gateway.pointerUp();
		if (result && result.boundingBox) {
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
