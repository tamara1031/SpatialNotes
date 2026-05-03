import { describe, expect, it } from "vitest";
import { ClipboardService } from "../../src/services/ClipboardService";
import type { CanvasElement } from "../../src/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

let idCounter = 0;

/** Deterministic fake factory: id = "el-<n>", all other fields from args. */
function makeFactory() {
	idCounter = 0;
	return (
		type: string,
		parentId: string,
		metadata: Record<string, unknown>,
	): CanvasElement => ({
		id: `el-${++idCounter}`,
		type,
		parentId,
		metadata,
		updatedAt: 0,
	});
}

function makeService() {
	return new ClipboardService(makeFactory());
}

const STROKE_EL: CanvasElement = {
	id: "orig-1",
	type: "ELEMENT_STROKE",
	parentId: "node-a",
	metadata: { points: [0, 0, 10, 0, 10, 10] },
	updatedAt: 100,
};

const TEXT_EL: CanvasElement = {
	id: "orig-2",
	type: "ELEMENT_TEXT",
	parentId: "node-a",
	metadata: { min_x: 20, min_y: 20, max_x: 80, max_y: 50, content: "hi" },
	updatedAt: 200,
};

function clipboardText(elements: CanvasElement[]): string {
	return JSON.stringify({
		version: "1.0",
		source: "spatial-notes",
		type: "elements",
		payload: elements,
	});
}

// ─── copySelection ────────────────────────────────────────────────────────────

describe("ClipboardService.copySelection", () => {
	it("serialises only the selected subset", () => {
		const svc = makeService();
		const json = svc.copySelection(["orig-1"], [STROKE_EL, TEXT_EL]);
		const data = JSON.parse(json);
		expect(data.source).toBe("spatial-notes");
		expect(data.payload).toHaveLength(1);
		expect(data.payload[0].id).toBe("orig-1");
	});

	it("returns all elements when all IDs are selected", () => {
		const svc = makeService();
		const json = svc.copySelection(["orig-1", "orig-2"], [STROKE_EL, TEXT_EL]);
		expect(JSON.parse(json).payload).toHaveLength(2);
	});

	it("returns empty payload when none of the IDs match", () => {
		const svc = makeService();
		const json = svc.copySelection(["unknown"], [STROKE_EL]);
		expect(JSON.parse(json).payload).toHaveLength(0);
	});
});

// ─── paste — input validation ─────────────────────────────────────────────────

describe("ClipboardService.paste — validation", () => {
	it("returns [] for plain text", () => {
		expect(makeService().paste("hello world", "node-x")).toEqual([]);
	});

	it("returns [] for malformed JSON", () => {
		expect(makeService().paste("{bad json", "node-x")).toEqual([]);
	});

	it("returns [] when source is wrong", () => {
		const json = JSON.stringify({
			version: "1.0",
			source: "other-app",
			type: "elements",
			payload: [STROKE_EL],
		});
		expect(makeService().paste(json, "node-x")).toEqual([]);
	});

	it("returns [] for empty payload array", () => {
		const json = JSON.stringify({
			source: "spatial-notes",
			payload: [],
		});
		expect(makeService().paste(json, "node-x")).toEqual([]);
	});
});

// ─── paste — default offset (+10/+10) ────────────────────────────────────────

describe("ClipboardService.paste — default offset", () => {
	it("assigns fresh IDs distinct from originals", () => {
		const svc = makeService();
		const text = clipboardText([STROKE_EL]);
		const [el] = svc.paste(text, "node-x");
		expect(el.id).not.toBe("orig-1");
		expect(el.id).toBe("el-1");
	});

	it("assigns the supplied activeNodeId as parentId", () => {
		const svc = makeService();
		const [el] = svc.paste(clipboardText([STROKE_EL]), "node-target");
		expect(el.parentId).toBe("node-target");
	});

	it("offsets ELEMENT_STROKE points by +10/+10", () => {
		const svc = makeService();
		const [el] = svc.paste(clipboardText([STROKE_EL]), "node-x");
		expect(el.metadata.points).toEqual([10, 10, 20, 10, 20, 20]);
	});

	it("offsets non-stroke bounding-box coordinates by +10/+10", () => {
		const svc = makeService();
		const [el] = svc.paste(clipboardText([TEXT_EL]), "node-x");
		expect(el.metadata.min_x).toBe(30);
		expect(el.metadata.min_y).toBe(30);
		expect(el.metadata.max_x).toBe(90);
		expect(el.metadata.max_y).toBe(60);
	});

	it("preserves non-positional metadata (content, color, etc.)", () => {
		const svc = makeService();
		const [el] = svc.paste(clipboardText([TEXT_EL]), "node-x");
		expect(el.metadata.content).toBe("hi");
	});

	it("handles pasting multiple elements — each gets a unique ID", () => {
		const svc = makeService();
		const elements = svc.paste(clipboardText([STROKE_EL, TEXT_EL]), "node-x");
		expect(elements).toHaveLength(2);
		expect(elements[0].id).not.toBe(elements[1].id);
	});

	it("repeated paste produces different IDs each time", () => {
		const svc = makeService();
		const text = clipboardText([STROKE_EL]);
		const [a] = svc.paste(text, "node-x");
		const [b] = svc.paste(text, "node-x");
		expect(a.id).not.toBe(b.id);
	});
});

// ─── paste — pasteOrigin (centering) ─────────────────────────────────────────

describe("ClipboardService.paste — pasteOrigin centering", () => {
	it("centres a single stroke at the given origin", () => {
		// STROKE_EL points: (0,0) (10,0) (10,10) → bbox [0,0..10,10] centre=(5,5)
		const svc = makeService();
		const [el] = svc.paste(clipboardText([STROKE_EL]), "node-x", {
			x: 50,
			y: 50,
		});
		// delta = (50-5, 50-5) = (45, 45)
		const pts = el.metadata.points as number[];
		expect(pts).toEqual([45, 45, 55, 45, 55, 55]);
	});

	it("centres a non-stroke element at the given origin", () => {
		// TEXT_EL bbox [20,20..80,50] centre = (50, 35)
		const svc = makeService();
		const [el] = svc.paste(clipboardText([TEXT_EL]), "node-x", {
			x: 0,
			y: 0,
		});
		// delta = (0-50, 0-35) = (-50, -35)
		expect(el.metadata.min_x).toBe(-30);
		expect(el.metadata.min_y).toBe(-15);
		expect(el.metadata.max_x).toBe(30);
		expect(el.metadata.max_y).toBe(15);
	});

	it("centres multiple elements collectively around origin", () => {
		// Collective bbox: min(0,20)..max(10,80) x, min(0,20)..max(10,50) y
		// → [0,0..80,50] centre = (40, 25)
		const svc = makeService();
		const elements = svc.paste(clipboardText([STROKE_EL, TEXT_EL]), "node-x", {
			x: 100,
			y: 100,
		});
		// dx = 100-40 = 60, dy = 100-25 = 75
		const strokePts = elements[0].metadata.points as number[];
		expect(strokePts[0]).toBeCloseTo(60);
		expect(strokePts[1]).toBeCloseTo(75);

		expect(elements[1].metadata.min_x).toBeCloseTo(80);
		expect(elements[1].metadata.min_y).toBeCloseTo(95);
	});

	it("still assigns fresh IDs when pasteOrigin is supplied", () => {
		const svc = makeService();
		const [el] = svc.paste(clipboardText([STROKE_EL]), "node-x", {
			x: 0,
			y: 0,
		});
		expect(el.id).not.toBe("orig-1");
	});
});

// ─── round-trip: copy then paste ─────────────────────────────────────────────

describe("ClipboardService — copy → paste round-trip", () => {
	it("restores type, metadata content, and parentId after a round-trip", () => {
		const svc = makeService();
		const clipText = svc.copySelection(["orig-2"], [STROKE_EL, TEXT_EL]);
		const [pasted] = svc.paste(clipText, "new-node");
		expect(pasted.type).toBe(TEXT_EL.type);
		expect(pasted.parentId).toBe("new-node");
		expect(pasted.metadata.content).toBe("hi");
	});
});
