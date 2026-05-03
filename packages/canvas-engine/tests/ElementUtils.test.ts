import { describe, expect, it } from "vitest";
import { ElementUtils } from "../src/utils/ElementUtils";

describe("ElementUtils", () => {
	describe("getBounds", () => {
		it("should calculate bounds for a stroke", () => {
			const el: any = {
				type: "ELEMENT_STROKE",
				metadata: { points: [0, 10, 100, 200] },
			} as any;
			const bounds = ElementUtils.getBounds(el);
			expect(bounds).toEqual({ minX: 0, minY: 10, maxX: 100, maxY: 200 });
		});

		it("should calculate bounds for an image", () => {
			const el: any = {
				type: "ELEMENT_IMAGE",
				metadata: { min_x: 5, min_y: 10, width: 50, height: 40 },
			} as any;
			const bounds = ElementUtils.getBounds(el);
			expect(bounds).toEqual({ minX: 5, minY: 10, maxX: 55, maxY: 50 });
		});

		it("returns zero bounds for a stroke with fewer than 2 points", () => {
			const el: any = { type: "ELEMENT_STROKE", metadata: { points: [] } };
			expect(ElementUtils.getBounds(el)).toEqual({
				minX: 0,
				minY: 0,
				maxX: 0,
				maxY: 0,
			});
		});
	});

	describe("offsetMetadata", () => {
		it("shifts stroke points by (dx, dy)", () => {
			const meta = { points: [0, 0, 10, 20] };
			const result = ElementUtils.offsetMetadata("ELEMENT_STROKE", meta, 5, -3);
			expect(result.points).toEqual([5, -3, 15, 17]);
		});

		it("does not mutate the original metadata", () => {
			const meta = { points: [0, 0, 10, 20] };
			ElementUtils.offsetMetadata("ELEMENT_STROKE", meta, 5, 5);
			expect(meta.points).toEqual([0, 0, 10, 20]);
		});

		it("shifts bounding-box fields for non-stroke elements", () => {
			const meta = { min_x: 10, min_y: 20, max_x: 50, max_y: 60 };
			const result = ElementUtils.offsetMetadata("ELEMENT_IMAGE", meta, 3, -2);
			expect(result).toMatchObject({
				min_x: 13,
				min_y: 18,
				max_x: 53,
				max_y: 58,
			});
		});

		it("omits bounding-box fields that were absent in the original", () => {
			const meta = { min_x: 10, min_y: 20 };
			const result = ElementUtils.offsetMetadata("ELEMENT_IMAGE", meta, 1, 1);
			expect(result.min_x).toBe(11);
			expect(result.min_y).toBe(21);
			expect(result.max_x).toBeUndefined();
			expect(result.max_y).toBeUndefined();
		});

		it("is a no-op for zero delta", () => {
			const meta = { points: [1, 2, 3, 4] };
			const result = ElementUtils.offsetMetadata("ELEMENT_STROKE", meta, 0, 0);
			expect(result.points).toEqual([1, 2, 3, 4]);
		});

		it("preserves unrelated metadata fields", () => {
			const meta = { min_x: 0, min_y: 0, max_x: 10, max_y: 10, z_index: 7, color: "#fff" };
			const result = ElementUtils.offsetMetadata("ELEMENT_IMAGE", meta, 1, 1);
			expect(result.z_index).toBe(7);
			expect(result.color).toBe("#fff");
		});
	});
});
