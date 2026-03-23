import { describe, expect, it, vi } from "vitest";
import { CanvasStore } from "../src/store/CanvasStore";

describe("CanvasStore", () => {
	it("should initialize with provided state", () => {
		const initialState = {
			viewport: { pan: { x: 10, y: 20 }, scale: 2.0 },
			elements: [],
			selectedElementIds: [],
			editingElementId: null,
			isInteracting: false,
			activeTool: "PEN" as any,
			penConfig: { color: "#000000", width: 1.0 },
			highlighterConfig: { color: "#ffff00", width: 5.0 },
			isSelecting: false,
			selectionStart: null,
			selectionEnd: null,
			isDraggingSelection: false,
			dragStartMm: null,
			selectionOffsetMm: { dx: 0, dy: 0 },
			isPanning: false,
			lastPanPos: null,
			activeNodeId: null,
			layoutMode: "INFINITE",
			pageSize: { width: 210, height: 297 },
			status: "LOADING" as const,
		};
		const store = new CanvasStore(initialState);
		expect(store.getState()).toEqual(initialState);
	});

	it("should initialize with status LOADING by default", () => {
		const store = new CanvasStore();
		expect(store.getState().status).toBe("LOADING");
	});

	it("should update state and notify subscribers", () => {
		const store = new CanvasStore({
			viewport: { pan: { x: 0, y: 0 }, scale: 1.0 },
		});
		const callback = vi.fn();
		store.subscribe(callback);

		store.update({ viewport: { pan: { x: 50, y: 50 }, scale: 1.5 } });

		expect(store.getState().viewport.pan).toEqual({ x: 50, y: 50 });
		expect(store.getState().viewport.scale).toBe(1.5);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("should broadcast actions via onAction", () => {
		const store = new CanvasStore();
		const actionCallback = vi.fn();
		store.onAction(actionCallback);

		store.emitCommand("TEST_ACTION", { foo: "bar" });

		expect(actionCallback).toHaveBeenCalledWith({
			type: "TEST_ACTION",
			payload: { foo: "bar" },
		});
	});

	it("should merge nested objects correctly if handled (actually CanvasStore.update uses spread on top level)", () => {
		const store = new CanvasStore({
			viewport: { pan: { x: 0, y: 0 }, scale: 1.0 },
		});
		store.update({ viewport: { ...store.getState().viewport, scale: 2.0 } });
		expect(store.getState().viewport.scale).toBe(2.0);
		expect(store.getState().viewport.pan).toEqual({ x: 0, y: 0 });
	});
});
