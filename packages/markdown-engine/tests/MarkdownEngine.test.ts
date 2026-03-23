import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownEngine } from "../src/index";
import { type MarkdownElement, MarkdownTool } from "../src/types";

// Mock the Worker
vi.stubGlobal(
	"Worker",
	class {
		onmessage: any;
		postMessage(data: any) {
			// Simulate immediate initialization
			if (data.type === "INIT") {
				setTimeout(() => {
					this.onmessage({ data: { type: "DONE", id: data.id } });
				}, 0);
			}
		}
		terminate() {}
	},
);

describe("MarkdownEngine", () => {
	let engine: MarkdownEngine;
	const elementFactory = vi.fn((type, parentId, metadata) => ({
		id: "test-id",
		type,
		parentId,
		metadata,
		updatedAt: Date.now(),
	}));

	beforeEach(() => {
		vi.useFakeTimers();
		engine = new MarkdownEngine(800, 600, elementFactory);
	});

	it("should initialize with correct status", () => {
		const onAction = vi.fn();
		engine.onAction(onAction);

		vi.runAllTimers();

		expect(onAction).toHaveBeenCalledWith(
			expect.objectContaining({ type: "STATUS", payload: "READY" }),
		);
	});

	it("should update elements and retrieve state correctly", () => {
		const testElements: MarkdownElement[] = [
			{
				id: "1",
				type: "PARAGRAPH",
				parentId: "node-1",
				metadata: { content: "Hello" },
				updatedAt: 123,
			},
		];

		engine.update({ elements: testElements });
		const state = engine.getState();

		expect(state.elements).toHaveLength(1);
		expect(state.elements[0].metadata.content).toBe("Hello");
	});
});
