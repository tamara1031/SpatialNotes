import { vi } from "vitest";

// Mock DOM methods for ProseMirror in JSDOM
if (typeof window !== "undefined") {
	window.Element.prototype.getClientRects = vi.fn(() => ({
		length: 0,
		item: () => null,
		[Symbol.iterator]: function* () {},
	})) as any;

	window.Element.prototype.getBoundingClientRect = vi.fn(() => ({
		width: 0,
		height: 0,
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
		x: 0,
		y: 0,
		toJSON: () => {},
	}));

	window.Range.prototype.getClientRects = vi.fn(() => ({
		length: 0,
		item: () => null,
		[Symbol.iterator]: function* () {},
	})) as any;

	window.Range.prototype.getBoundingClientRect = vi.fn(() => ({
		width: 0,
		height: 0,
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
		x: 0,
		y: 0,
		toJSON: () => {},
	}));

	document.elementFromPoint = vi.fn();
}
