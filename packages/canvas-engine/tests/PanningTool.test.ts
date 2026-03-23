import { describe, expect, it, vi } from "vitest";
import { CanvasStore } from "../src/store/CanvasStore";
import { PanningTool } from "../src/tools/PanningTool";

describe("PanningTool", () => {
	it("should update viewport pan on pointer move", () => {
		const store = new CanvasStore({
			viewport: { pan: { x: 100, y: 100 }, scale: 1.0 },
		});
		const tool = new PanningTool();
		const ctx = {
			store,
			services: {},
		} as any;

		const downEvent = { clientX: 200, clientY: 200 } as any;
		tool.onPointerDown(downEvent, ctx, { x: 200, y: 200 });

		const moveEvent = { clientX: 250, clientY: 260 } as any;
		tool.onPointerMove(moveEvent, ctx, { x: 250, y: 260 });

		const viewport = store.getState().viewport;
		expect(viewport.pan).toEqual({ x: 150, y: 160 });
	});
});
