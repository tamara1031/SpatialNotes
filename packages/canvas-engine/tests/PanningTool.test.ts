import { describe, expect, it, vi } from "vitest";
import { CanvasStore } from "../src/store/CanvasStore";
import { PanningTool } from "../src/tools/PanningTool";

describe("PanningTool", () => {
	it("should dispatch PAN command on pointer move", () => {
		const store = new CanvasStore({
			viewport: { pan: { x: 100, y: 100 }, scale: 1.0 },
		});
		const bus = { dispatch: vi.fn() };
		const tool = new PanningTool();
		const ctx = {
			store,
			dispatch: (a: any) => bus.dispatch(a),
			services: {},
		} as any;

		const downEvent = { clientX: 200, clientY: 200 } as any;
		tool.onPointerDown(downEvent, ctx);

		const moveEvent = { clientX: 250, clientY: 260 } as any;
		tool.onPointerMove(moveEvent, ctx);

		const viewport = store.getState().viewport;
		expect(viewport.pan).toEqual({ x: 150, y: 160 });
	});
});
