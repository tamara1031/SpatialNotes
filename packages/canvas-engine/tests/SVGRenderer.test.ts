/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SVGRenderer } from "../src/render/SVGRenderer";
import type { CanvasState } from "../src/store/CanvasStore";

describe("SVGRenderer", () => {
	let container: HTMLDivElement;
	let renderer: SVGRenderer;
	let mockStore: any;
	let mockGateway: any;

	beforeEach(() => {
		container = document.createElement("div");
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

		mockGateway = {
			exportSVG: vi.fn().mockResolvedValue("<svg></svg>"),
			getStrokePath: vi.fn().mockResolvedValue(""),
		};

		renderer = new SVGRenderer({
			onTextEdit: vi.fn(),
			onTextEditCancel: vi.fn(),
		});
		renderer.mount(container, mockGateway);
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
		expect(svgElement?.style.overflow).toBe("visible");
	});
});
