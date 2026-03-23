/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SVGRenderer } from "../src/render/SVGRenderer";
import type { CanvasState } from "../src/store/CanvasStore";

vi.mock("canvas-wasm", () => ({
	smooth_stroke_svg: vi.fn().mockReturnValue("M 0 0 L 10 10"),
}));

describe("SVGRenderer", () => {
	let container: HTMLDivElement;
	let renderer: SVGRenderer;
	let mockStore: any;
	let mockBridge: any;

	beforeEach(() => {
		container = document.createElement("div");
		// Prevent JS DOM missing methods from crashing SVG element creation
		if (!container.setPointerCapture) container.setPointerCapture = vi.fn();
		if (!container.releasePointerCapture)
			container.releasePointerCapture = vi.fn();

		mockStore = {
			getState: () => ({
				elements: [],
				selectionIds: [],
				currentPath: null,
				activeTool: "PEN",
				layoutMode: "SINGLE",
				pageSize: { width: 210, height: 297 },
				orientation: "PORTRAIT",
				viewport: { pan: { x: 0, y: 0 }, scale: 1 },
			}),
			subscribe: vi.fn(),
		};

		renderer = new SVGRenderer({
			onTextEdit: vi.fn(),
			onTextEditCancel: vi.fn(),
		});
		renderer.mount(container);
	});

	it("SC-R2: Layout Boundaries Rendering (INFINITE mode)", () => {
		const state: CanvasState = {
			...mockStore.getState(),
			layoutMode: "INFINITE",
		};

		renderer.render(state);

		// Find paperSurface which should now have the radial-gradient for INF mode
		const paperSurface = container
			.querySelector("div")
			?.querySelector("div") as HTMLElement;
		expect(paperSurface).toBeDefined();
		expect(paperSurface.style.display).toBe("block"); // Should always be visible
		expect(paperSurface.style.backgroundImage).toContain("radial-gradient");

		// svgElement should have overflow: visible
		const svgElement = container.querySelector("svg");
		expect(svgElement).toBeDefined();
		expect(svgElement!.style.overflow).toBe("visible");
	});
});
