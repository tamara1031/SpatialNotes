import { describe, expect, it, vi } from "vitest";
import { CanvasStore } from "../src/store/CanvasStore";
import { CanvasTool } from "../src/types";

// Minimal CanvasElement factory for tests.
function makeElement(id: string, overrides: Record<string, unknown> = {}) {
	return {
		id,
		type: "STROKE",
		parentId: "node-1",
		metadata: { points: [0, 0, 10, 10], color: "#fff", width: 1.2 },
		updatedAt: 0,
		...overrides,
	};
}

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

		store.emitCommand({
			type: "UPDATE_ELEMENTS",
			payload: [{ id: "el-1", changes: { metadata: { foo: "bar" } } }],
		});

		expect(actionCallback).toHaveBeenCalledWith({
			type: "UPDATE_ELEMENTS",
			payload: [{ id: "el-1", changes: { metadata: { foo: "bar" } } }],
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

	it("subscribe() unsubscribe stops further notifications", () => {
		const store = new CanvasStore();
		const cb = vi.fn();
		const unsub = store.subscribe(cb);

		store.update({ status: "READY" });
		expect(cb).toHaveBeenCalledTimes(1);

		unsub();
		store.update({ status: "ERROR" });
		expect(cb).toHaveBeenCalledTimes(1); // no additional call
	});
});

describe("CanvasStore.dispatch — action contracts", () => {
	it("CREATE_ELEMENT appends element to state and emits CREATE command", () => {
		const store = new CanvasStore();
		const commandSpy = vi.fn();
		store.onAction(commandSpy);

		const el = makeElement("el-1");
		store.dispatch({ type: "CREATE_ELEMENT", payload: el });

		expect(store.getState().elements).toHaveLength(1);
		expect(store.getState().elements[0].id).toBe("el-1");
		expect(commandSpy).toHaveBeenCalledWith({ type: "CREATE", payload: el });
	});

	it("CREATE_ELEMENT notifies state subscribers", () => {
		const store = new CanvasStore();
		const notifySpy = vi.fn();
		store.subscribe(notifySpy);

		store.dispatch({ type: "CREATE_ELEMENT", payload: makeElement("el-1") });

		expect(notifySpy).toHaveBeenCalledTimes(1);
	});

	it("UPDATE_ELEMENTS merges metadata shallowly without clobbering untouched fields", () => {
		const el = makeElement("el-1", {
			metadata: { points: [0, 0, 10, 10], color: "#fff", width: 1.2 },
		});
		const store = new CanvasStore({ elements: [el] });

		store.dispatch({
			type: "UPDATE_ELEMENTS",
			payload: [{ id: "el-1", changes: { metadata: { color: "#f00" } } }],
		});

		const updated = store.getState().elements[0];
		expect(updated.metadata.color).toBe("#f00");
		expect(updated.metadata.points).toEqual([0, 0, 10, 10]);
	});

	it("UPDATE_ELEMENTS emits UPDATE_ELEMENTS command with the update records", () => {
		const el = makeElement("el-1");
		const store = new CanvasStore({ elements: [el] });
		const commandSpy = vi.fn();
		store.onAction(commandSpy);

		const updates = [{ id: "el-1", changes: { metadata: { color: "#f00" } } }];
		store.dispatch({ type: "UPDATE_ELEMENTS", payload: updates });

		expect(commandSpy).toHaveBeenCalledWith({
			type: "UPDATE_ELEMENTS",
			payload: updates,
		});
	});

	it("UPDATE_ELEMENTS silently ignores ids not present in elements", () => {
		const store = new CanvasStore({ elements: [makeElement("el-1")] });
		expect(() =>
			store.dispatch({
				type: "UPDATE_ELEMENTS",
				payload: [{ id: "ghost", changes: { metadata: { color: "#f00" } } }],
			}),
		).not.toThrow();
		expect(store.getState().elements).toHaveLength(1);
	});

	it("DELETE_ELEMENTS removes the element from state", () => {
		const store = new CanvasStore({
			elements: [makeElement("el-1"), makeElement("el-2")],
		});

		store.dispatch({ type: "DELETE_ELEMENTS", payload: ["el-1"] });

		const ids = store.getState().elements.map((e) => e.id);
		expect(ids).toEqual(["el-2"]);
	});

	it("DELETE_ELEMENTS also evicts the id from selectedElementIds", () => {
		const store = new CanvasStore({
			elements: [makeElement("el-1"), makeElement("el-2")],
			selectedElementIds: ["el-1", "el-2"],
		});

		store.dispatch({ type: "DELETE_ELEMENTS", payload: ["el-1"] });

		expect(store.getState().selectedElementIds).toEqual(["el-2"]);
	});

	it("DELETE_ELEMENTS emits a BATCH command with one DELETE entry per id", () => {
		const store = new CanvasStore({
			elements: [makeElement("el-1"), makeElement("el-2")],
		});
		const commandSpy = vi.fn();
		store.onAction(commandSpy);

		store.dispatch({ type: "DELETE_ELEMENTS", payload: ["el-1", "el-2"] });

		expect(commandSpy).toHaveBeenCalledWith({
			type: "BATCH",
			payload: [
				{ type: "DELETE", payload: { id: "el-1" } },
				{ type: "DELETE", payload: { id: "el-2" } },
			],
		});
	});

	it("SET_VIEWPORT updates viewport in state without emitting a command", () => {
		const store = new CanvasStore();
		const commandSpy = vi.fn();
		store.onAction(commandSpy);

		store.dispatch({
			type: "SET_VIEWPORT",
			payload: { pan: { x: 100, y: 200 }, scale: 2 },
		});

		expect(store.getState().viewport).toEqual({
			pan: { x: 100, y: 200 },
			scale: 2,
		});
		expect(commandSpy).not.toHaveBeenCalled();
	});

	it("SET_TOOL updates activeTool in state without emitting a command", () => {
		const store = new CanvasStore({ activeTool: CanvasTool.PEN });
		const commandSpy = vi.fn();
		store.onAction(commandSpy);

		store.dispatch({ type: "SET_TOOL", payload: CanvasTool.ERASER });

		expect(store.getState().activeTool).toBe(CanvasTool.ERASER);
		expect(commandSpy).not.toHaveBeenCalled();
	});

	it("UNDO emits UNDO command without mutating state", () => {
		const store = new CanvasStore({ elements: [makeElement("el-1")] });
		const commandSpy = vi.fn();
		store.onAction(commandSpy);
		const before = store.getState().elements.length;

		store.dispatch({ type: "UNDO" });

		expect(store.getState().elements).toHaveLength(before);
		expect(commandSpy).toHaveBeenCalledWith({ type: "UNDO" });
	});

	it("REDO emits REDO command without mutating state", () => {
		const store = new CanvasStore({ elements: [makeElement("el-1")] });
		const commandSpy = vi.fn();
		store.onAction(commandSpy);
		const before = store.getState().elements.length;

		store.dispatch({ type: "REDO" });

		expect(store.getState().elements).toHaveLength(before);
		expect(commandSpy).toHaveBeenCalledWith({ type: "REDO" });
	});
});

describe("CanvasStore.dispatch — BATCH atomicity", () => {
	it("BATCH notifies subscribers exactly once regardless of sub-action count", () => {
		const store = new CanvasStore();
		const notifySpy = vi.fn();
		store.subscribe(notifySpy);

		store.dispatch({
			type: "BATCH",
			payload: [
				{ type: "CREATE_ELEMENT", payload: makeElement("el-1") },
				{ type: "CREATE_ELEMENT", payload: makeElement("el-2") },
				{ type: "CREATE_ELEMENT", payload: makeElement("el-3") },
			],
		});

		expect(notifySpy).toHaveBeenCalledTimes(1);
	});

	it("BATCH applies all sub-actions to state before the single notification fires", () => {
		const store = new CanvasStore();
		let capturedCount = -1;
		store.subscribe(() => {
			capturedCount = store.getState().elements.length;
		});

		store.dispatch({
			type: "BATCH",
			payload: [
				{ type: "CREATE_ELEMENT", payload: makeElement("el-1") },
				{ type: "CREATE_ELEMENT", payload: makeElement("el-2") },
			],
		});

		// The subscriber observed the fully-applied state (both elements present)
		expect(capturedCount).toBe(2);
	});

	it("BATCH correctly applies mixed action types (CREATE then DELETE)", () => {
		const store = new CanvasStore({
			elements: [makeElement("el-existing")],
		});
		const notifySpy = vi.fn();
		store.subscribe(notifySpy);

		store.dispatch({
			type: "BATCH",
			payload: [
				{ type: "CREATE_ELEMENT", payload: makeElement("el-new") },
				{ type: "DELETE_ELEMENTS", payload: ["el-existing"] },
			],
		});

		const ids = store.getState().elements.map((e) => e.id);
		expect(ids).toEqual(["el-new"]);
		expect(notifySpy).toHaveBeenCalledTimes(1);
	});

	it("nested BATCH still results in exactly one notification per outer BATCH", () => {
		const store = new CanvasStore();
		const notifySpy = vi.fn();
		store.subscribe(notifySpy);

		store.dispatch({
			type: "BATCH",
			payload: [
				{
					type: "BATCH",
					payload: [
						{ type: "CREATE_ELEMENT", payload: makeElement("el-1") },
						{ type: "CREATE_ELEMENT", payload: makeElement("el-2") },
					],
				},
				{ type: "CREATE_ELEMENT", payload: makeElement("el-3") },
			],
		});

		expect(store.getState().elements).toHaveLength(3);
		expect(notifySpy).toHaveBeenCalledTimes(1);
	});
});

describe("CanvasStore — typed event subscriptions (on)", () => {
	it("on(ELEMENTS_CHANGED) fires with new element list when elements are added", () => {
		const store = new CanvasStore();
		const listener = vi.fn();
		store.on("ELEMENTS_CHANGED", listener);

		const el = makeElement("el-1");
		store.dispatch({ type: "CREATE_ELEMENT", payload: el });

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith(
			expect.arrayContaining([expect.objectContaining({ id: "el-1" })]),
		);
	});

	it("on(VIEWPORT_CHANGED) fires when SET_VIEWPORT changes the viewport", () => {
		const store = new CanvasStore();
		const listener = vi.fn();
		store.on("VIEWPORT_CHANGED", listener);

		store.dispatch({
			type: "SET_VIEWPORT",
			payload: { pan: { x: 50, y: 50 }, scale: 1.5 },
		});

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith({ pan: { x: 50, y: 50 }, scale: 1.5 });
	});

	it("on(TOOL_CHANGED) fires when SET_TOOL changes the active tool", () => {
		const store = new CanvasStore({ activeTool: CanvasTool.PEN });
		const listener = vi.fn();
		store.on("TOOL_CHANGED", listener);

		store.dispatch({ type: "SET_TOOL", payload: CanvasTool.HIGHLIGHTER });

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith(CanvasTool.HIGHLIGHTER);
	});

	it("on() returns an unsubscribe function that stops future events", () => {
		const store = new CanvasStore();
		const listener = vi.fn();
		const unsub = store.on("ELEMENTS_CHANGED", listener);

		store.dispatch({ type: "CREATE_ELEMENT", payload: makeElement("el-1") });
		expect(listener).toHaveBeenCalledTimes(1);

		unsub();
		store.dispatch({ type: "CREATE_ELEMENT", payload: makeElement("el-2") });
		expect(listener).toHaveBeenCalledTimes(1); // no additional call
	});

	it("on(SELECTION_CHANGED) fires when selectedElementIds changes via UPDATE_ELEMENTS path", () => {
		const store = new CanvasStore({
			elements: [makeElement("el-1")],
			selectedElementIds: ["el-1"],
		});
		const listener = vi.fn();
		store.on("SELECTION_CHANGED", listener);

		store.dispatch({ type: "DELETE_ELEMENTS", payload: ["el-1"] });

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith([]);
	});
});

describe("CanvasStore — snapshot round-trip", () => {
	it("getSnapshot returns a deep clone — mutating it does not affect store state", () => {
		const el = makeElement("el-1");
		const store = new CanvasStore({ elements: [el] });

		const snap = store.getSnapshot();
		(snap.elements[0].metadata as Record<string, unknown>).color = "mutated";

		expect(
			(store.getState().elements[0].metadata as Record<string, unknown>).color,
		).toBe("#fff");
	});

	it("applySnapshot restores state and notifies subscribers", () => {
		const store = new CanvasStore({ elements: [makeElement("el-1")] });
		const notifySpy = vi.fn();
		store.subscribe(notifySpy);

		const snap = store.getSnapshot();
		snap.elements = [makeElement("el-2"), makeElement("el-3")];

		store.applySnapshot(snap);

		expect(store.getState().elements.map((e) => e.id)).toEqual([
			"el-2",
			"el-3",
		]);
		expect(notifySpy).toHaveBeenCalledTimes(1);
	});

	it("applySnapshot deep-clones elements so subsequent mutations stay isolated", () => {
		const store = new CanvasStore();
		const snap = store.getSnapshot();
		snap.elements = [makeElement("el-1")];

		store.applySnapshot(snap);
		// Mutate the source snapshot after applying it
		(snap.elements[0].metadata as Record<string, unknown>).color = "mutated";

		expect(
			(store.getState().elements[0].metadata as Record<string, unknown>).color,
		).toBe("#fff");
	});
});
