import type { InteractionContext, Tool } from "./Tool";

/**
 * Wraps each pointer handler in a uniform try/catch so tool-level failures are
 * logged with context but never propagate up to InteractionManager's async
 * event handler (which would silently swallow the rejection in browser DOM).
 */
export abstract class AbstractTool implements Tool {
	protected abstract _onPointerDown(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void>;

	protected abstract _onPointerMove(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void>;

	protected abstract _onPointerUp(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void>;

	protected _onDoubleClick?(
		e: MouseEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void>;

	abstract getCursor(): string;

	async onPointerDown(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void> {
		try {
			await this._onPointerDown(e, ctx, coords);
		} catch (err) {
			console.error(`${this.constructor.name}: onPointerDown failed`, err);
		}
	}

	async onPointerMove(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void> {
		try {
			await this._onPointerMove(e, ctx, coords);
		} catch (err) {
			console.error(`${this.constructor.name}: onPointerMove failed`, err);
		}
	}

	async onPointerUp(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void> {
		try {
			await this._onPointerUp(e, ctx, coords);
		} catch (err) {
			console.error(`${this.constructor.name}: onPointerUp failed`, err);
		}
	}

	async onDoubleClick(
		e: MouseEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	): Promise<void> {
		if (!this._onDoubleClick) return;
		try {
			await this._onDoubleClick(e, ctx, coords);
		} catch (err) {
			console.error(`${this.constructor.name}: onDoubleClick failed`, err);
		}
	}
}
