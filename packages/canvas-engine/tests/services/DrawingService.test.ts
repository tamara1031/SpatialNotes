import { describe, expect, it, vi } from "vitest";
import { DrawingService } from "../../src/services/DrawingService";
import { CanvasStore } from "../../src/store/CanvasStore";

describe("DrawingService", () => {
	it("should create a stroke record with given points and config", () => {
		const store = new CanvasStore({
			activeNodeId: "node-1",
			elements: [],
		});
		const mockElementFactory = (
			type: string,
			parentId: string,
			metadata: any,
		) => ({
			id: "mock-id",
			type,
			parentId,
			metadata,
			updatedAt: Date.now(),
		});
		const emitSpy = vi.spyOn(store, "emitCommand");
		const service = new DrawingService(store, mockElementFactory as any);

		const points = [0, 0, 10, 10];
		const config = { color: "#ff0000", width: 2 };

		service.createStroke(points, config);

		// Optimistic update
		expect(store.getState().elements).toHaveLength(1);
		const record = store.getState().elements[0];
		expect(record.type).toBe("ELEMENT_STROKE");
		expect(record.metadata.points).toEqual(points);
		expect(record.metadata.color).toBe(config.color);

		// Emit command via store
		expect(emitSpy).toHaveBeenCalledTimes(1);
		expect(emitSpy).toHaveBeenCalledWith("CREATE", record);
	});
});
