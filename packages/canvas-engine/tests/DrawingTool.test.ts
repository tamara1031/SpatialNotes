import { describe, expect, it, vi } from "vitest";
import { CanvasStore } from "../src/store/CanvasStore";
import { DrawingTool } from "../src/tools/DrawingTool";
import type { InteractionContext } from "../src/tools/Tool";

describe("DrawingTool (SC-U10)", () => {
	it("should create two independent strokes for two consecutive drawing actions", async () => {
		const store = new CanvasStore({
			activeNodeId: "test-node",
			layoutMode: "SINGLE",
			pageSize: { width: 210, height: 297 },
		});
		const drawingService = { createStroke: vi.fn() };

		const gatewayMock = {
			pointerDown: vi.fn().mockResolvedValue(undefined),
			getStrokePath: vi.fn().mockResolvedValue("M 10 10 L 20 20"),
			pointerUp: vi.fn(),
		};

		const ctx: InteractionContext = {
			store,
			renderer: {} as any,
			gateway: gatewayMock as any,
			services: { drawing: drawingService as any } as any,
			updateCursor: vi.fn(),
		};

		const tool = new DrawingTool();

		const mockPoints = [10, 10, 20, 20];

		// Stroke 1
		gatewayMock.pointerUp.mockResolvedValueOnce({
			boundingBox: [10, 10, 20, 20],
			points: mockPoints,
			pressures: [],
			tilt_xs: [],
			tilt_ys: [],
		});

		const coords1 = { x: 10, y: 10 };
		const coords2 = { x: 20, y: 20 };
		await tool.onPointerDown({ clientX: 10, clientY: 10 } as any, ctx, coords1);
		await tool.onPointerMove({ clientX: 20, clientY: 20 } as any, ctx, coords2);
		await tool.onPointerUp({} as any, ctx, coords2);

		expect(drawingService.createStroke).toHaveBeenCalledTimes(1);
		expect(drawingService.createStroke).toHaveBeenCalledWith(
			mockPoints,
			expect.anything(),
			expect.anything(),
		);

		// Stroke 2
		const mockPoints2 = [50, 50, 60, 60];
		gatewayMock.pointerUp.mockResolvedValueOnce({
			boundingBox: [50, 50, 60, 60],
			points: mockPoints2,
			pressures: [],
			tilt_xs: [],
			tilt_ys: [],
		});

		const coords3 = { x: 50, y: 50 };
		const coords4 = { x: 60, y: 60 };
		await tool.onPointerDown({ clientX: 50, clientY: 50 } as any, ctx, coords3);
		await tool.onPointerMove({ clientX: 60, clientY: 60 } as any, ctx, coords4);
		await tool.onPointerUp({} as any, ctx, coords4);

		expect(drawingService.createStroke).toHaveBeenCalledTimes(2);
		expect(drawingService.createStroke).toHaveBeenLastCalledWith(
			mockPoints2,
			expect.anything(),
			expect.anything(),
		);
	});
});
