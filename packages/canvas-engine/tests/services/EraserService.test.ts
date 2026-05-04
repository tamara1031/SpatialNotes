import { describe, expect, it, vi } from "vitest";
import { EraserService } from "../../src/services/EraserService";
import { CanvasStore } from "../../src/store/CanvasStore";

describe("EraserService", () => {
	it("should emit DELETE command for a single hit in standard mode", async () => {
		const store = new CanvasStore({
			elements: [
				{
					id: "el-1",
					type: "ELEMENT_STROKE",
					parentId: "p1",
					metadata: {} as any,
					updatedAt: 0,
				},
			],
			selectedElementIds: [],
		});
		const gateway = {
			queryAt: vi.fn().mockResolvedValue(["el-1"]),
			getInteractionPoints: vi.fn().mockResolvedValue([]),
		} as any;
		const emitSpy = vi.spyOn(store, "emitCommand");

		const service = new EraserService(store, gateway);
		await service.eraseAt(10, 10, 3, false);

		expect(store.getState().elements).toHaveLength(0);
		expect(emitSpy).toHaveBeenCalledWith({
			type: "BATCH",
			payload: [{ type: "DELETE", payload: { id: "el-1" } }],
		});
	});

	it("should emit a BATCH command for multiple hits in standard mode", async () => {
		const store = new CanvasStore({
			elements: [
				{
					id: "el-1",
					type: "ELEMENT_STROKE",
					parentId: "p1",
					metadata: {} as any,
					updatedAt: 0,
				},
				{
					id: "el-2",
					type: "ELEMENT_TEXT",
					parentId: "p1",
					metadata: {} as any,
					updatedAt: 0,
				},
			],
			selectedElementIds: [],
		});
		const gateway = {
			queryAt: vi.fn().mockResolvedValue(["el-1", "el-2"]),
			getInteractionPoints: vi.fn().mockResolvedValue([]),
		} as any;
		const emitSpy = vi.spyOn(store, "emitCommand");

		const service = new EraserService(store, gateway);
		await service.eraseAt(10, 10, 3, false);

		expect(store.getState().elements).toHaveLength(0);
		expect(emitSpy).toHaveBeenCalledWith({
			type: "BATCH",
			payload: [
				{ type: "DELETE", payload: { id: "el-1" } },
				{ type: "DELETE", payload: { id: "el-2" } },
			],
		});
	});

	it("should handle precision erasure by splitting strokes", async () => {
		const store = new CanvasStore({
			elements: [
				{
					id: "stroke-1",
					type: "ELEMENT_STROKE",
					parentId: "p1",
					metadata: { points: [0, 0, 10, 10, 20, 20] } as any,
					updatedAt: 0,
				},
			],
			selectedElementIds: [],
		});
		const gateway = {
			queryAt: vi.fn().mockResolvedValue(["stroke-1"]),
			getInteractionPoints: vi.fn().mockResolvedValue([5, 5, 6, 6]),
			partialErase: vi.fn().mockResolvedValue([
				{
					id: "frag-1",
					parent_id: "p1",
					data: { type: "ELEMENT_STROKE", points: [0, 0, 4, 4] },
				},
				{
					id: "frag-2",
					parent_id: "p1",
					data: { type: "ELEMENT_STROKE", points: [7, 7, 20, 20] },
				},
			]),
		} as any;
		const emitSpy = vi.spyOn(store, "emitCommand");

		const service = new EraserService(store, gateway);
		await service.eraseAt(5, 5, 2, true);

		const state = store.getState();
		expect(state.elements).toHaveLength(2);
		expect(state.elements.find((e) => e.id === "stroke-1")).toBeUndefined();
		expect(state.elements.some((e) => e.id === "frag-1")).toBe(true);

		// New dispatch pattern emits BATCH (for delete) and CREATE (per fragment)
		expect(emitSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "BATCH",
				payload: expect.arrayContaining([
					expect.objectContaining({
						type: "DELETE",
						payload: { id: "stroke-1" },
					}),
				]),
			}),
		);
		expect(emitSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "CREATE",
				payload: expect.objectContaining({ id: "frag-1" }),
			}),
		);
		expect(emitSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "CREATE",
				payload: expect.objectContaining({ id: "frag-2" }),
			}),
		);

		// Fragment element type must come from data.type, not be duplicated in metadata
		const frag1 = state.elements.find((e) => e.id === "frag-1");
		expect(frag1?.type).toBe("ELEMENT_STROKE");
		expect(frag1?.metadata).not.toHaveProperty("type");
		expect(frag1?.metadata.points).toEqual([0, 0, 4, 4]);
	});
});
