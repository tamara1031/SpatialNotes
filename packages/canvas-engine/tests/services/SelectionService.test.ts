import { describe, expect, it, vi } from "vitest";
import { SelectionService } from "../../src/services/SelectionService";
import { CanvasStore } from "../../src/store/CanvasStore";
import type { CanvasElement } from "../../src/types";

function makeStroke(id: string, points: number[], zIndex = 0): CanvasElement {
	return {
		id,
		type: "ELEMENT_STROKE",
		parentId: "node-1",
		metadata: { points, color: "#000", width: 1, z_index: zIndex },
		updatedAt: 0,
	};
}

function makeImage(
	id: string,
	bounds: { minX: number; minY: number; maxX: number; maxY: number },
	zIndex = 0,
): CanvasElement {
	return {
		id,
		type: "ELEMENT_IMAGE",
		parentId: "node-1",
		metadata: {
			min_x: bounds.minX,
			min_y: bounds.minY,
			max_x: bounds.maxX,
			max_y: bounds.maxY,
			z_index: zIndex,
		},
		updatedAt: 0,
	};
}

function makeGateway() {
	return { queryAt: vi.fn().mockResolvedValue([]) } as any;
}

function zIndexOf(store: CanvasStore, id: string): number {
	return (
		(store.getState().elements.find((e) => e.id === id)?.metadata
			.z_index as number) ?? 0
	);
}

// ── bringToFront ────────────────────────────────────────────────────────────

describe("SelectionService.bringToFront", () => {
	it("sets moved element z_index above all unchanged elements", () => {
		const store = new CanvasStore({
			elements: [
				makeStroke("a", [0, 0], 1),
				makeStroke("b", [1, 1], 2),
				makeStroke("c", [2, 2], 3),
			],
		});
		const emitSpy = vi.spyOn(store, "emitCommand");
		const service = new SelectionService(store, makeGateway());

		service.bringToFront(["a"]);

		expect(zIndexOf(store, "a")).toBeGreaterThan(3);

		expect(emitSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "UPDATE_ELEMENTS",
				payload: expect.arrayContaining([
					expect.objectContaining({
						id: "a",
						changes: expect.objectContaining({
							metadata: expect.objectContaining({
								z_index: expect.any(Number),
							}),
						}),
					}),
				]),
			}),
		);
	});

	it("assigns ascending z_index values preserving relative order among multiple moved elements", () => {
		const store = new CanvasStore({
			elements: [
				makeStroke("a", [0, 0], 1),
				makeStroke("b", [1, 1], 2),
				makeStroke("c", [2, 2], 5),
			],
		});
		const service = new SelectionService(store, makeGateway());

		service.bringToFront(["a", "b"]);

		const zA = zIndexOf(store, "a");
		const zB = zIndexOf(store, "b");
		const zC = zIndexOf(store, "c");

		expect(zA).toBeGreaterThan(zC);
		expect(zB).toBeGreaterThan(zC);
		expect(zA).toBeLessThan(zB);
	});

	it("is a no-op when ids list is empty", () => {
		const store = new CanvasStore({
			elements: [makeStroke("a", [0, 0], 1)],
		});
		const emitSpy = vi.spyOn(store, "emitCommand");
		const service = new SelectionService(store, makeGateway());

		service.bringToFront([]);

		expect(emitSpy).toHaveBeenCalledWith(
			expect.objectContaining({ type: "UPDATE_ELEMENTS", payload: [] }),
		);
		expect(zIndexOf(store, "a")).toBe(1);
	});
});

// ── sendToBack ──────────────────────────────────────────────────────────────

describe("SelectionService.sendToBack", () => {
	it("sets moved element z_index below all unchanged elements", () => {
		const store = new CanvasStore({
			elements: [
				makeStroke("a", [0, 0], 1),
				makeStroke("b", [1, 1], 2),
				makeStroke("c", [2, 2], 3),
			],
		});
		const emitSpy = vi.spyOn(store, "emitCommand");
		const service = new SelectionService(store, makeGateway());

		service.sendToBack(["c"]);

		expect(zIndexOf(store, "c")).toBeLessThan(1);

		expect(emitSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "UPDATE_ELEMENTS",
				payload: expect.arrayContaining([
					expect.objectContaining({
						id: "c",
						changes: expect.objectContaining({
							metadata: expect.objectContaining({
								z_index: expect.any(Number),
							}),
						}),
					}),
				]),
			}),
		);
	});

	it("assigns descending z_index values preserving relative order among multiple moved elements", () => {
		const store = new CanvasStore({
			elements: [
				makeStroke("a", [0, 0], 0),
				makeStroke("b", [1, 1], 5),
				makeStroke("c", [2, 2], 6),
			],
		});
		const service = new SelectionService(store, makeGateway());

		service.sendToBack(["b", "c"]);

		const zA = zIndexOf(store, "a");
		const zB = zIndexOf(store, "b");
		const zC = zIndexOf(store, "c");

		expect(zB).toBeLessThan(zA);
		expect(zC).toBeLessThan(zA);
		expect(zB).toBeLessThan(zC);
	});
});

// ── moveElements ────────────────────────────────────────────────────────────

describe("SelectionService.moveElements", () => {
	it("translates stroke points by (dx, dy)", () => {
		const store = new CanvasStore({
			elements: [makeStroke("s1", [10, 20, 30, 40])],
		});
		const emitSpy = vi.spyOn(store, "emitCommand");
		const service = new SelectionService(store, makeGateway());

		service.moveElements(["s1"], 5, -3);

		const updated = store.getState().elements.find((e) => e.id === "s1");
		expect(updated?.metadata.points).toEqual([15, 17, 35, 37]);

		expect(emitSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "UPDATE_ELEMENTS",
				payload: expect.arrayContaining([
					expect.objectContaining({
						id: "s1",
						changes: expect.objectContaining({
							metadata: expect.objectContaining({
								points: [15, 17, 35, 37],
							}),
						}),
					}),
				]),
			}),
		);
	});

	it("translates image bounding box coordinates by (dx, dy)", () => {
		const store = new CanvasStore({
			elements: [makeImage("img1", { minX: 10, minY: 20, maxX: 50, maxY: 60 })],
		});
		const service = new SelectionService(store, makeGateway());

		service.moveElements(["img1"], 10, -5);

		const updated = store.getState().elements.find((e) => e.id === "img1");
		expect(updated?.metadata.min_x).toBe(20);
		expect(updated?.metadata.min_y).toBe(15);
		expect(updated?.metadata.max_x).toBe(60);
		expect(updated?.metadata.max_y).toBe(55);
	});

	it("silently skips ids not present in the store", () => {
		const store = new CanvasStore({
			elements: [makeStroke("s1", [0, 0])],
		});
		const emitSpy = vi.spyOn(store, "emitCommand");
		const service = new SelectionService(store, makeGateway());

		service.moveElements(["nonexistent"], 5, 5);

		expect(emitSpy).toHaveBeenCalledWith(
			expect.objectContaining({ type: "UPDATE_ELEMENTS", payload: [] }),
		);
	});

	it("moves multiple elements in one dispatch", () => {
		const store = new CanvasStore({
			elements: [
				makeStroke("s1", [0, 0, 10, 10]),
				makeStroke("s2", [20, 20, 30, 30]),
			],
		});
		const emitSpy = vi.spyOn(store, "emitCommand");
		const service = new SelectionService(store, makeGateway());

		service.moveElements(["s1", "s2"], 1, 2);

		expect(emitSpy).toHaveBeenCalledTimes(1);
		const cmd = emitSpy.mock.calls[0][0] as any;
		expect(cmd.payload).toHaveLength(2);
	});
});

// ── selectArea ──────────────────────────────────────────────────────────────

describe("SelectionService.selectArea", () => {
	it("queries the worker with midpoint and half-diagonal radius", async () => {
		const store = new CanvasStore({ elements: [] });
		const gateway = {
			queryAt: vi.fn().mockResolvedValue(["el-1", "el-2"]),
		} as any;
		const service = new SelectionService(store, gateway);

		const ids = await service.selectArea(0, 0, 10, 10);

		expect(gateway.queryAt).toHaveBeenCalledWith(5, 5, 5);
		expect(ids).toEqual(["el-1", "el-2"]);
	});

	it("handles non-square selections correctly", async () => {
		const store = new CanvasStore({ elements: [] });
		const gateway = { queryAt: vi.fn().mockResolvedValue([]) } as any;
		const service = new SelectionService(store, gateway);

		await service.selectArea(10, 20, 30, 40);

		// midpoint: (20, 30), radius = max(20, 20) / 2 = 10
		expect(gateway.queryAt).toHaveBeenCalledWith(20, 30, 10);
	});
});
