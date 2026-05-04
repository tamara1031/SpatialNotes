import { describe, expect, it } from "vitest";
import {
	clientPixelToMm,
	mmToClientPixel,
	PIXELS_PER_MM,
} from "../../src/utils/coordinates";

describe("PIXELS_PER_MM", () => {
	it("is 3.78 (96 DPI)", () => {
		expect(PIXELS_PER_MM).toBe(3.78);
	});
});

describe("clientPixelToMm", () => {
	it("converts pixel offset at identity viewport (pan=0, scale=1)", () => {
		expect(clientPixelToMm(37.8, 0, 1)).toBeCloseTo(10, 5);
	});

	it("applies pan before dividing by scale", () => {
		// 75.6px offset - 37.8px pan = 37.8px net → 10mm at scale=1
		expect(clientPixelToMm(75.6, 37.8, 1)).toBeCloseTo(10, 5);
	});

	it("divides by scale correctly", () => {
		// At scale=2, 75.6px offset / (2 * 3.78) = 10mm
		expect(clientPixelToMm(75.6, 0, 2)).toBeCloseTo(10, 5);
	});

	it("returns 0 when pixelOffset equals pan at any scale", () => {
		expect(clientPixelToMm(50, 50, 1.5)).toBe(0);
		expect(clientPixelToMm(100, 100, 3)).toBe(0);
	});
});

describe("mmToClientPixel", () => {
	it("converts mm to pixel offset at identity viewport", () => {
		expect(mmToClientPixel(10, 0, 1)).toBeCloseTo(37.8, 5);
	});

	it("adds pan offset", () => {
		expect(mmToClientPixel(10, 37.8, 1)).toBeCloseTo(75.6, 5);
	});

	it("is the inverse of clientPixelToMm", () => {
		const pan = 42;
		const scale = 1.5;
		const mm = 25;
		const pixel = mmToClientPixel(mm, pan, scale);
		expect(clientPixelToMm(pixel, pan, scale)).toBeCloseTo(mm, 10);
	});
});
