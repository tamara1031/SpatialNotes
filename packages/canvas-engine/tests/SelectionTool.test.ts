import { describe, expect, it, vi } from "vitest";
import { CanvasStore } from "../src/store/CanvasStore";
import { SelectionTool } from "../src/tools/SelectionTool";
import type { InteractionContext } from "../src/tools/Tool";
import { CanvasTool } from "../src/types";

function makeCtx(
	store: CanvasStore,
	gatewayOverrides: Partial<{
		getElementAt: ReturnType<typeof vi.fn>;
		queryAt: ReturnType<typeof vi.fn>;
	}> = {},
): InteractionContext {
	return {
		store,
		renderer: {} as any,
		gateway: {
			getElementAt: vi.fn().mockResolvedValue(null),
			queryAt: vi.fn().mockResolvedValue([]),
			...gatewayOverrides,
		} as any,
		services: {
			drawing: {} as any,
			eraser: {} as any,
			selection: {
				selectArea: vi.fn().mockResolvedValue([]),
				moveElements: vi.fn(),
			} as any,
		},
		updateCursor: vi.fn(),
	};
}

describe("SelectionTool — onDoubleClick", () => {
	it("queries using the passed MM coords, not hardcoded (0,0)", async () => {
		const store = new CanvasStore({ activeTool: CanvasTool.SELECTOR });
		const getElementAt = vi.fn().mockResolvedValue(null);
		const ctx = makeCtx(store, { getElementAt });
		const tool = new SelectionTool();

		const coords = { x: 42, y: 77 };
		await tool.onDoubleClick({} as MouseEvent, ctx, coords);

		expect(getElementAt).toHaveBeenCalledWith(42, 77);
		expect(getElementAt).not.toHaveBeenCalledWith(0, 0);
	});

	it("opens editing mode for a TEXT element hit at double-click position", async () => {
		const store = new CanvasStore({
			activeTool: CanvasTool.SELECTOR,
			elements: [
				{
					id: "text-el",
					type: "ELEMENT_TEXT",
					parentId: "node-1",
					metadata: {},
					updatedAt: 0,
				},
			],
		});
		const ctx = makeCtx(store, {
			getElementAt: vi.fn().mockResolvedValue("text-el"),
		});
		const tool = new SelectionTool();

		await tool.onDoubleClick({} as MouseEvent, ctx, { x: 10, y: 20 });

		expect(store.getState().editingElementId).toBe("text-el");
		expect(store.getState().selectedElementIds).toContain("text-el");
	});

	it("does not open editing mode for non-TEXT elements", async () => {
		const store = new CanvasStore({
			activeTool: CanvasTool.SELECTOR,
			elements: [
				{
					id: "stroke-el",
					type: "ELEMENT_STROKE",
					parentId: "node-1",
					metadata: {},
					updatedAt: 0,
				},
			],
		});
		const ctx = makeCtx(store, {
			getElementAt: vi.fn().mockResolvedValue("stroke-el"),
		});
		const tool = new SelectionTool();

		await tool.onDoubleClick({} as MouseEvent, ctx, { x: 5, y: 5 });

		expect(store.getState().editingElementId).toBeNull();
	});
});

describe("SelectionTool — async error recovery", () => {
	it("does not throw when getElementAt rejects on pointer down", async () => {
		const store = new CanvasStore({ activeTool: CanvasTool.PICKER });
		const ctx = makeCtx(store, {
			getElementAt: vi.fn().mockRejectedValue(new Error("worker crashed")),
		});
		const tool = new SelectionTool();

		// Error is caught internally; await ensures the rejection is handled
		await expect(
			tool.onPointerDown({} as PointerEvent, ctx, { x: 10, y: 10 }),
		).resolves.toBeUndefined();
	});

	it("does not throw when getElementAt rejects on double click", async () => {
		const store = new CanvasStore({ activeTool: CanvasTool.SELECTOR });
		const ctx = makeCtx(store, {
			getElementAt: vi.fn().mockRejectedValue(new Error("timeout")),
		});
		const tool = new SelectionTool();

		// Error is caught internally; state must remain clean
		await expect(
			tool.onDoubleClick({} as MouseEvent, ctx, { x: 5, y: 5 }),
		).resolves.toBeUndefined();

		expect(store.getState().editingElementId).toBeNull();
	});
});
