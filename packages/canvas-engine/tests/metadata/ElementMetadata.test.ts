import { describe, expect, it, vi } from "vitest";
import {
	MetadataKey,
	getNumber,
	getNumberArray,
} from "../../src/metadata/ElementMetadata";

describe("MetadataKey", () => {
	it("exposes all expected keys as string literals", () => {
		expect(MetadataKey.Z_INDEX).toBe("z_index");
		expect(MetadataKey.POINTS).toBe("points");
		expect(MetadataKey.MIN_X).toBe("min_x");
		expect(MetadataKey.MIN_Y).toBe("min_y");
		expect(MetadataKey.MAX_X).toBe("max_x");
		expect(MetadataKey.MAX_Y).toBe("max_y");
		expect(MetadataKey.WIDTH).toBe("width");
		expect(MetadataKey.HEIGHT).toBe("height");
		expect(MetadataKey.COLOR).toBe("color");
	});
});

describe("getNumber", () => {
	it("returns the value when key holds a valid number", () => {
		expect(getNumber({ z_index: 5 }, "z_index")).toBe(5);
	});

	it("returns zero-value numbers correctly (not confused with falsy)", () => {
		expect(getNumber({ z_index: 0 }, "z_index")).toBe(0);
		expect(getNumber({ z_index: -3 }, "z_index")).toBe(-3);
	});

	it("returns the fallback when the key is missing", () => {
		expect(getNumber({}, "z_index")).toBe(0);
		expect(getNumber({}, "z_index", 99)).toBe(99);
	});

	it("returns the fallback when the value is null", () => {
		expect(getNumber({ z_index: null }, "z_index", 7)).toBe(7);
	});

	it("returns the fallback and warns when the value is a non-number", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(getNumber({ z_index: "high" }, "z_index", 42)).toBe(42);
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('"z_index"'),
		);
		warn.mockRestore();
	});

	it("returns the fallback and warns when value is a boolean", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(getNumber({ z_index: true }, "z_index")).toBe(0);
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});
});

describe("getNumberArray", () => {
	it("returns the array when the key holds a number[]", () => {
		expect(getNumberArray({ points: [1, 2, 3, 4] }, "points")).toEqual([
			1, 2, 3, 4,
		]);
	});

	it("returns empty array when the key is missing", () => {
		expect(getNumberArray({}, "points")).toEqual([]);
	});

	it("returns the value for an empty array", () => {
		expect(getNumberArray({ points: [] }, "points")).toEqual([]);
	});

	it("returns empty array and warns when the value is not an array", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(getNumberArray({ points: "bad" }, "points")).toEqual([]);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('"points"'));
		warn.mockRestore();
	});

	it("returns empty array without warning when the value is null", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(getNumberArray({ points: null }, "points")).toEqual([]);
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});
});
