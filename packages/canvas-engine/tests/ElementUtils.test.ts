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
	});
});
