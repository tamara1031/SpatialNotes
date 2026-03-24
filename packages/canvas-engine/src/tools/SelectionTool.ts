import { CanvasTool } from "../types";
import { ElementUtils } from "../utils/ElementUtils";
import type { InteractionContext, Tool } from "./Tool";

export class SelectionTool implements Tool {
	onPointerDown(
		e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	) {
		const state = ctx.store.getState();
		const { x, y } = ElementUtils.clipCoords(
			coords.x,
			coords.y,
			state.layoutMode,
			state.pageSize,
		);

		ctx.gateway.getElementAt(x, y).then((hitId) => {
			const isAlreadySelected = hitId
				? state.selectedElementIds.includes(hitId)
				: false;

			if (state.activeTool === CanvasTool.PICKER) {
				if (hitId) {
					let newSelection = state.selectedElementIds;
					if (!e.shiftKey && !isAlreadySelected) {
						newSelection = [hitId];
					} else if (e.shiftKey) {
						if (isAlreadySelected) {
							newSelection = state.selectedElementIds.filter(
								(id) => id !== hitId,
							);
						} else {
							newSelection = [...state.selectedElementIds, hitId];
						}
					}
					ctx.store.update({
						selectedElementIds: newSelection,
						isDraggingSelection: true,
						dragStartMm: { x, y },
						selectionOffsetMm: { dx: 0, dy: 0 },
					});
				} else {
					ctx.store.update({ selectedElementIds: [] });
				}
				return;
			}

			if (state.activeTool === CanvasTool.SELECTOR) {
				if (isAlreadySelected) {
					ctx.store.update({
						isDraggingSelection: true,
						dragStartMm: { x, y },
						selectionOffsetMm: { dx: 0, dy: 0 },
					});
				} else {
					ctx.store.update({
						isSelecting: true,
						selectionStart: { x, y },
						selectionEnd: { x, y },
						selectedElementIds: [],
					});
				}
			}
		});
	}

	onPointerMove(
		_e: PointerEvent,
		ctx: InteractionContext,
		coords: { x: number; y: number },
	) {
		const state = ctx.store.getState();
		const { x, y } = ElementUtils.clipCoords(
			coords.x,
			coords.y,
			state.layoutMode,
			state.pageSize,
		);

		if (state.isDraggingSelection && state.dragStartMm) {
			ctx.store.update({
				selectionOffsetMm: {
					dx: x - state.dragStartMm.x,
					dy: y - state.dragStartMm.y,
				},
			});
			return;
		}

		if (state.isSelecting) {
			ctx.store.update({ selectionEnd: { x, y } });
		}
	}

	onPointerUp(
		_e: PointerEvent,
		ctx: InteractionContext,
		_coords: { x: number; y: number },
	) {
		const state = ctx.store.getState();
		if (state.isDraggingSelection) {
			if (
				state.selectionOffsetMm.dx !== 0 ||
				state.selectionOffsetMm.dy !== 0
			) {
				ctx.services.selection.moveElements(
					state.selectedElementIds,
					state.selectionOffsetMm.dx,
					state.selectionOffsetMm.dy,
				);
			}
			ctx.store.update({
				isDraggingSelection: false,
				selectionOffsetMm: { dx: 0, dy: 0 },
			});
		}

		if (state.isSelecting && state.selectionStart && state.selectionEnd) {
			const minX = Math.min(state.selectionStart.x, state.selectionEnd.x);
			const minY = Math.min(state.selectionStart.y, state.selectionEnd.y);
			const maxX = Math.max(state.selectionStart.x, state.selectionEnd.x);
			const maxY = Math.max(state.selectionStart.y, state.selectionEnd.y);

			ctx.services.selection.selectArea(minX, minY, maxX, maxY).then((ids) => {
				ctx.store.update({ selectedElementIds: ids });
			});
		}

		ctx.store.update({
			isSelecting: false,
			selectionStart: null,
			selectionEnd: null,
		});
	}

	onDoubleClick(_e: MouseEvent, ctx: InteractionContext) {
		const state = ctx.store.getState();

		ctx.gateway.getElementAt(0, 0).then((hitId) => {
			if (hitId) {
				const el = state.elements.find((e) => e.id === hitId);
				if (el && el.type === "ELEMENT_TEXT") {
					ctx.store.update({
						editingElementId: hitId,
						selectedElementIds: [hitId],
					});
				}
			}
		});
	}

	getCursor() {
		return "default";
	}
}
