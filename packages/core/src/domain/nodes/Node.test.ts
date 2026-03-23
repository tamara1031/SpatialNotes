import { describe, expect, it, vi } from "vitest";
import { Chapter, Notebook } from "./Node";
import { NodeFactory } from "./NodeFactory";

describe("Node and NodeFactory", () => {
	const userId = "user-1";

	it("should create a Chapter node", () => {
		const record = NodeFactory.createRecord(
			"CHAPTER",
			null,
			userId,
			{},
			"Root",
		);
		const node = NodeFactory.create(record);
		expect(node).toBeInstanceOf(Chapter);
		expect(node.name).toBe("Root");
		expect(node.type).toBe("CHAPTER");
	});

	it("should create a Notebook node", () => {
		const record = NodeFactory.createRecord(
			"NOTEBOOK",
			"parent-1",
			userId,
			{},
			"My Note",
		);
		const node = NodeFactory.create(record);
		expect(node).toBeInstanceOf(Notebook);
		expect(node.parentId).toBe("parent-1");
	});

	it("should handle recursive deletion markers", () => {
		const root = new Chapter(
			NodeFactory.createRecord("CHAPTER", null, userId, {}, "Root"),
		);
		root.markDeleted();
		expect(root.isDeleted).toBe(true);
	});

	it("should throw error for unknown types", () => {
		const record = NodeFactory.createRecord("CHAPTER", null, userId);
		(record as any).type = "UNKNOWN";
		expect(() => NodeFactory.create(record)).toThrow(
			"Unknown node type: UNKNOWN",
		);
	});

	it("should support visitor pattern for Chapter", () => {
		const chapter = new Chapter(
			NodeFactory.createRecord("CHAPTER", null, userId),
		);
		const visitor = {
			visitChapter: vi.fn(),
			visitElement: vi.fn(),
		};
		chapter.accept(visitor);
		expect(visitor.visitChapter).toHaveBeenCalledWith(chapter);
	});
});
