import type { InteractionManager } from "./InteractionManager";
import type { CanvasStore } from "./store/CanvasStore";
import { CanvasTool } from "./types";

/**
 * Handles all DOM-level interactions (pointer, wheel, keyboard).
 * Decouples DOM event management from the core CanvasEngine coordination.
 */
export class InteractionHandler {
	private container: HTMLElement | null = null;
	private wheelHandler: (e: WheelEvent) => void;
	private keydownHandler: (e: KeyboardEvent) => void;

	constructor(
		private interactionManager: InteractionManager,
		private store: CanvasStore,
	) {
		this.wheelHandler = this.handleWheel.bind(this);
		this.keydownHandler = this.handleKeyDown.bind(this);
	}

	public attach(container: HTMLElement) {
		this.container = container;
		this.interactionManager.mount(container);

		container.addEventListener("pointerdown", this.handlePointerDown);
		container.addEventListener("pointermove", this.handlePointerMove);
		container.addEventListener("pointerup", this.handlePointerUp);
		container.addEventListener("dblclick", this.handleDoubleClick);
		container.addEventListener("contextmenu", this.handleContextMenu);
		container.addEventListener("wheel", this.wheelHandler, { passive: false });
	}

	public detach() {
		if (!this.container) return;

		this.container.removeEventListener("pointerdown", this.handlePointerDown);
		this.container.removeEventListener("pointermove", this.handlePointerMove);
		this.container.removeEventListener("pointerup", this.handlePointerUp);
		this.container.removeEventListener("dblclick", this.handleDoubleClick);
		this.container.removeEventListener("contextmenu", this.handleContextMenu);
		this.container.removeEventListener("wheel", this.wheelHandler);

		this.container = null;
	}

	private handlePointerDown = (e: PointerEvent) => {
		if (this.container) this.container.setPointerCapture(e.pointerId);
		this.interactionManager.handlePointerDown(e);
	};

	private handlePointerMove = (e: PointerEvent) => {
		this.interactionManager.handlePointerMove(e);
	};

	private handlePointerUp = (e: PointerEvent) => {
		if (this.container) this.container.releasePointerCapture(e.pointerId);
		this.interactionManager.handlePointerUp(e);
	};

	private handleDoubleClick = (e: MouseEvent) => {
		this.interactionManager.handleDoubleClick(e);
	};

	private handleContextMenu = (e: MouseEvent) => {
		e.preventDefault();
	};

	private handleWheel(e: WheelEvent) {
		e.preventDefault();
		const state = this.store.getState();
		if (!e.shiftKey) {
			const zoomSpeed = 0.0015;
			const delta = -e.deltaY;
			const newScale = Math.min(
				Math.max(state.viewport.scale + delta * zoomSpeed, 0.1),
				5,
			);
			this.store.dispatch({
				type: "SET_VIEWPORT",
				payload: { ...state.viewport, scale: newScale },
			});
		} else {
			this.store.dispatch({
				type: "SET_VIEWPORT",
				payload: {
					pan: {
						x: state.viewport.pan.x - e.deltaX,
						y: state.viewport.pan.y - e.deltaY,
					},
					scale: state.viewport.scale,
				},
			});
		}
	}

	public handleKeyDown(e: KeyboardEvent): boolean {
		if (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement
		)
			return false;
		const state = this.store.getState();

		if (e.ctrlKey || e.metaKey) {
			if (e.key === "z") {
				this.store.dispatch({ type: e.shiftKey ? "REDO" : "UNDO" });
				e.preventDefault();
				return true;
			} else if (e.key === "y") {
				this.store.dispatch({ type: "REDO" });
				e.preventDefault();
				return true;
			}
		}

		if (e.key === "Delete" || e.key === "Backspace") {
			if (state.selectedElementIds.length > 0) {
				this.store.dispatch({
					type: "DELETE_ELEMENTS",
					payload: state.selectedElementIds,
				});
				return true;
			}
		}
		return false;
	}
}
