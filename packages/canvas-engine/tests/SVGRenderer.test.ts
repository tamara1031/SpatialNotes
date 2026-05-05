/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SVGRenderer } from "../src/render/SVGRenderer";
import type { CanvasState } from "../src/store/CanvasStore";
import { CanvasTool } from "../src/types";

// ── Shared base state ────────────────────────────────────────────────────────
const BASE_STATE: CanvasState = {
	elements: [],
	activeNodeId: null,
	viewport: { pan: { x: 0, y: 0 }, scale: 1 },
	activeTool: CanvasTool.PEN,
	selectedElementIds: [],
	editingElementId: null,
	isInteracting: false,
	isSelecting: false,
	selectionStart: null,
	selectionEnd: null,
	isDraggingSelection: false,
	dragStartMm: null,
	selectionOffsetMm: { dx: 0, dy: 0 },
	isPanning: false,
	lastPanPos: null,
	penConfig: { color: "#ffffff", width: 1.2 },
	highlighterConfig: { color: "rgba(255, 235, 59, 0.3)", width: 8 },
	layoutMode: "SINGLE",
	pageSize: { width: 210, height: 297 },
	status: "READY",
};

function makeStroke(id: string, overrides: Record<string, unknown> = {}) {
	return {
		id,
		type: "ELEMENT_STROKE",
		parentId: "root",
		metadata: {
			points: [0, 0, 10, 10, 20, 5],
			color: "#ffffff",
			width: 1.2,
			z_index: 0,
			...overrides,
		},
		updatedAt: 1,
		isDeleted: false,
	};
}

function makeText(id: string, content = "Hello", updatedAt = 1) {
	return {
		id,
		type: "ELEMENT_TEXT",
		parentId: "root",
		metadata: { content, min_x: 10, min_y: 10, z_index: 0 },
		updatedAt,
		isDeleted: false,
	};
}

function s(overrides: Partial<CanvasState>): CanvasState {
	return { ...BASE_STATE, ...overrides };
}

// ── DOM query helpers ────────────────────────────────────────────────────────
// Paths inside elementsGroup only (excludes the interactionPath at SVG root)
function elementPaths(c: HTMLElement): SVGPathElement[] {
	return Array.from(
		c.querySelectorAll(".engine-viewport-root > svg > g > path"),
	) as SVGPathElement[];
}

// Divs directly inside htmlElementsLayer (text element containers)
function textDivs(c: HTMLElement): HTMLDivElement[] {
	const layer = c.querySelector(
		".engine-viewport-root > div:last-of-type",
	) as HTMLElement | null;
	return Array.from(
		layer?.querySelectorAll(":scope > div") ?? [],
	) as HTMLDivElement[];
}

// Textareas inside htmlElementsLayer (active text editing overlays)
function textareas(c: HTMLElement): HTMLTextAreaElement[] {
	const layer = c.querySelector(
		".engine-viewport-root > div:last-of-type",
	) as HTMLElement | null;
	return Array.from(
		layer?.querySelectorAll("textarea") ?? [],
	) as HTMLTextAreaElement[];
}

// ── Test suite ───────────────────────────────────────────────────────────────
describe("SVGRenderer — keyed DOM reconciliation", () => {
	let container: HTMLDivElement;
	let renderer: SVGRenderer;
	let mockGateway: { exportSVG: ReturnType<typeof vi.fn>; getStrokePath: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		container = document.createElement("div");
		mockGateway = {
			exportSVG: vi.fn().mockResolvedValue("<svg></svg>"),
			getStrokePath: vi.fn().mockResolvedValue(""),
		};
		renderer = new SVGRenderer({
			onTextEdit: vi.fn(),
			onTextEditCancel: vi.fn(),
		});
		renderer.mount(container, mockGateway as any);
	});

	it("SC-R2: Layout Boundaries Rendering (INFINITE mode)", () => {
		renderer.render(s({ layoutMode: "INFINITE" }));

		const paperSurface = container
			.querySelector("div")
			?.querySelector("div") as HTMLElement;
		expect(paperSurface).toBeDefined();
		expect(paperSurface.style.display).toBe("block");
		expect(paperSurface.style.backgroundImage).toContain("radial-gradient");

		const svgElement = container.querySelector("svg");
		expect(svgElement).toBeDefined();
		expect(svgElement?.style.overflow).toBe("visible");
	});

	// ── Node identity / fingerprint skipping ──────────────────────────────

	it("reuses the same SVG path node when neither element data nor selection changes", () => {
		const el = makeStroke("a");
		const elements = [el] as any;
		renderer.render(s({ elements }));
		const [pathBefore] = elementPaths(container);

		// Second render: same elements reference → no DOM work
		renderer.render(s({ elements }));
		const [pathAfter] = elementPaths(container);

		expect(pathAfter).toBe(pathBefore);
	});

	it("reuses the same SVG path node when only the viewport changes", () => {
		const el = makeStroke("b");
		const elements = [el] as any;
		renderer.render(s({ elements, viewport: { pan: { x: 0, y: 0 }, scale: 1 } }));
		const [pathBefore] = elementPaths(container);

		renderer.render(s({ elements, viewport: { pan: { x: 50, y: 30 }, scale: 1.5 } }));
		const [pathAfter] = elementPaths(container);

		expect(pathAfter).toBe(pathBefore);
	});

	// ── In-place attribute updates ────────────────────────────────────────

	it("updates stroke color in-place (same node) when element metadata changes", () => {
		const v1 = { ...makeStroke("c"), metadata: { points: [0, 0, 10, 10, 20, 5], color: "#ffffff", width: 1.2, z_index: 0 }, updatedAt: 1 } as any;
		renderer.render(s({ elements: [v1] }));
		const [pathBefore] = elementPaths(container);
		expect(pathBefore.getAttribute("stroke")).toBe("#ffffff");

		const v2 = { ...v1, metadata: { ...v1.metadata, color: "#ff0000" }, updatedAt: 2 };
		renderer.render(s({ elements: [v2] }));
		const [pathAfter] = elementPaths(container);

		expect(pathAfter).toBe(pathBefore); // same DOM node
		expect(pathAfter.getAttribute("stroke")).toBe("#ff0000"); // attribute updated
	});

	it("updates stroke highlight in-place when selection state changes", () => {
		const el = makeStroke("d") as any;
		const elements = [el];
		renderer.render(s({ elements }));
		const [path] = elementPaths(container);
		expect(path.getAttribute("stroke")).toBe("#ffffff");

		// Select the element (elements ref stays the same)
		renderer.render(s({ elements, selectedElementIds: ["d"] }));
		const [pathAfter] = elementPaths(container);

		expect(pathAfter).toBe(path); // same node
		expect(pathAfter.getAttribute("stroke")).toBe("var(--accent, #0078ff)");
	});

	// ── Stale node removal ────────────────────────────────────────────────

	it("removes the SVG path node when the element is deleted from the array", () => {
		const el = makeStroke("e") as any;
		renderer.render(s({ elements: [el] }));
		expect(elementPaths(container)).toHaveLength(1);

		renderer.render(s({ elements: [] }));
		expect(elementPaths(container)).toHaveLength(0);
	});

	it("removes a path but keeps others when one of multiple elements is deleted", () => {
		const a = { ...makeStroke("f"), updatedAt: 1 } as any;
		const b = { ...makeStroke("g"), updatedAt: 1 } as any;
		renderer.render(s({ elements: [a, b] }));
		expect(elementPaths(container)).toHaveLength(2);
		const [, pathB] = elementPaths(container);

		renderer.render(s({ elements: [b] }));
		expect(elementPaths(container)).toHaveLength(1);
		expect(elementPaths(container)[0]).toBe(pathB); // surviving node is reused
	});

	// ── DOM ordering ──────────────────────────────────────────────────────

	it("renders elements in z_index order (lower z_index appears earlier in DOM)", () => {
		const back = { ...makeStroke("h"), metadata: { points: [0, 0, 5, 5], color: "#aaa", width: 1, z_index: 0 }, updatedAt: 1 } as any;
		const front = { ...makeStroke("i"), metadata: { points: [0, 0, 5, 5], color: "#bbb", width: 1, z_index: 10 }, updatedAt: 1 } as any;
		// Intentionally add front-first to test that sorting works
		renderer.render(s({ elements: [front, back] }));

		const paths = elementPaths(container);
		expect(paths).toHaveLength(2);
		// back (z=0) should be first in DOM (painted underneath)
		expect(paths[0].getAttribute("stroke")).toBe("#aaa");
		expect(paths[1].getAttribute("stroke")).toBe("#bbb");
	});

	it("re-establishes DOM order when z_index changes (bring-to-front)", () => {
		const a = { ...makeStroke("j"), metadata: { points: [0, 0, 5, 5], color: "#aaa", width: 1, z_index: 0 }, updatedAt: 1 } as any;
		const b = { ...makeStroke("k"), metadata: { points: [0, 0, 5, 5], color: "#bbb", width: 1, z_index: 1 }, updatedAt: 1 } as any;
		renderer.render(s({ elements: [a, b] }));
		expect(elementPaths(container)[0].getAttribute("stroke")).toBe("#aaa");

		// Promote a to front by giving it a higher z_index and bumping updatedAt
		const aFront = { ...a, metadata: { ...a.metadata, z_index: 5 }, updatedAt: 2 };
		renderer.render(s({ elements: [aFront, b] }));

		const paths = elementPaths(container);
		expect(paths[0].getAttribute("stroke")).toBe("#bbb"); // b is now behind
		expect(paths[1].getAttribute("stroke")).toBe("#aaa"); // a is now in front
	});

	// ── isDeleted soft-delete flag ────────────────────────────────────────

	it("excludes soft-deleted elements (isDeleted=true) from rendering", () => {
		const active = makeStroke("l") as any;
		const deleted = { ...makeStroke("m"), isDeleted: true } as any;
		renderer.render(s({ elements: [active, deleted] }));

		expect(elementPaths(container)).toHaveLength(1);
	});

	// ── Text editing lifecycle ─────────────────────────────────────────────

	it("creates a textarea overlay when a text element enters edit mode", () => {
		const el = makeText("n") as any;
		const elements = [el];
		renderer.render(s({ elements }));
		expect(textDivs(container)).toHaveLength(1);
		expect(textareas(container)).toHaveLength(0);

		// Trigger edit mode (elements ref unchanged — only editingElementId changes)
		renderer.render(s({ elements, editingElementId: "n" }));
		expect(textareas(container)).toHaveLength(1);
		expect(textDivs(container)[0].style.visibility).toBe("hidden");
	});

	it("removes the textarea and restores div visibility when editing ends", () => {
		const el = makeText("o") as any;
		const elements = [el];
		renderer.render(s({ elements, editingElementId: "o" }));
		expect(textareas(container)).toHaveLength(1);

		renderer.render(s({ elements, editingElementId: null }));
		expect(textareas(container)).toHaveLength(0);
		expect(textDivs(container)[0].style.visibility).not.toBe("hidden");
	});

	it("preserves text div node identity across edit mode transitions", () => {
		const el = makeText("p") as any;
		const elements = [el];
		renderer.render(s({ elements }));
		const [divBefore] = textDivs(container);

		renderer.render(s({ elements, editingElementId: "p" }));
		renderer.render(s({ elements, editingElementId: null }));
		const [divAfter] = textDivs(container);

		expect(divAfter).toBe(divBefore); // div reused across the full lifecycle
	});
});
