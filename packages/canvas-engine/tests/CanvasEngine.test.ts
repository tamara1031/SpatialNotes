import { beforeEach, describe, expect, it, vi } from "vitest";
import { CanvasEngine } from "../src/index";

vi.mock("../src/bridge/WorkerGateway", () => {
	return {
		WorkerGateway: class {
			init = vi.fn().mockResolvedValue(undefined);
			bindCanvas = vi.fn().mockResolvedValue(undefined);
			upsertElement = vi.fn().mockResolvedValue(undefined);
			removeElement = vi.fn().mockResolvedValue(undefined);
			pointerDown = vi.fn().mockResolvedValue(undefined);
			pointerMove = vi.fn().mockResolvedValue(undefined);
			pointerUp = vi.fn().mockResolvedValue(undefined);
			sync = vi.fn().mockResolvedValue(undefined);
			getElementAt = vi.fn().mockResolvedValue(null);
			queryAt = vi.fn().mockResolvedValue([]);
			exportSVG = vi.fn().mockResolvedValue("<svg>mock</svg>");
			getCurrentStrokePath = vi.fn().mockResolvedValue("");
			getInteractionPoints = vi.fn().mockResolvedValue([]);
			terminate = vi.fn();
		},
	};
});

describe("CanvasEngine (Worker Implementation)", () => {
	let engine: CanvasEngine;

	beforeEach(() => {
		// Mocking ElementFactory
		const mockFactory = vi
			.fn()
			.mockImplementation((type, parentId, metadata) => ({
				id: "mock-id",
				type,
				parentId,
				metadata,
				updatedAt: Date.now(),
			}));

		engine = new CanvasEngine(210, 297, mockFactory);
		vi.clearAllMocks();
	});

	it("should hold state via update()", () => {
		const mockPatch = {
			elements: [
				{
					id: "1",
					parentId: "node-1",
					type: "ELEMENT_STROKE",
					metadata: { points: [0, 0, 10, 10] },
					updatedAt: Date.now(),
				},
			] as any,
			viewport: { pan: { x: 10, y: 20 }, scale: 1.5 },
			context: {
				activeNodeId: "node-1",
				pageSize: { width: 210, height: 297 },
				layoutMode: "SINGLE" as any,
			},
		};

		engine.update(mockPatch);
		const state = engine.getState();

		expect(state.elements).toHaveLength(1);
		expect(state.viewport.pan).toEqual({ x: 10, y: 20 });
		expect(state.viewport.scale).toBe(1.5);
	});

	it("should manage viewport state", () => {
		const mockPatch = {
			viewport: { pan: { x: 100, y: 200 }, scale: 2.0 },
		};

		engine.update(mockPatch);
		expect(engine.getState().viewport.scale).toBe(2.0);
	});

	it("should emit actions via onAction", () => {
		const callback = vi.fn();
		engine.onAction(callback);

		// Simulating an internal "CREATE" event via store action emission
		(engine as any).onActionCallback({
			type: "CREATE",
			payload: { id: "new-id" },
		});

		expect(callback).toHaveBeenCalledWith({
			type: "CREATE",
			payload: { id: "new-id" },
		});
	});
});
