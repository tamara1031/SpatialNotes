import { describe, expect, it, vi } from "vitest";
import { NODE_DELETED, NODE_MOVED, NODE_RENAMED } from "./events.js";
import { Chapter, Notebook } from "./Node.js";
import { NodeFactory } from "./NodeFactory.js";

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

	it("should mark a node as deleted", () => {
		const root = new Chapter(
			NodeFactory.createRecord("CHAPTER", null, userId, {}, "Root"),
		);
		root.delete();
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

	describe("domain events", () => {
		it("rename() emits a NodeRenamedEvent with the new name", () => {
			const node = new Chapter(
				NodeFactory.createRecord("CHAPTER", null, userId, {}, "Old"),
			);
			node.rename("New Name");
			const events = node.domainEvents;
			expect(events).toHaveLength(1);
			expect(events[0].type).toBe(NODE_RENAMED);
			expect(events[0].payload).toMatchObject({
				id: node.id,
				name: "New Name",
			});
		});

		it("move() emits a NodeMovedEvent with the new parentId", () => {
			const node = new Chapter(
				NodeFactory.createRecord("CHAPTER", null, userId),
			);
			node.move("parent-42");
			const events = node.domainEvents;
			expect(events).toHaveLength(1);
			expect(events[0].type).toBe(NODE_MOVED);
			expect(events[0].payload).toMatchObject({
				id: node.id,
				parentId: "parent-42",
			});
		});

		it("move() emits NodeMovedEvent with null when moved to root", () => {
			const node = new Chapter(
				NodeFactory.createRecord("CHAPTER", "old-parent", userId),
			);
			node.move(null);
			expect(node.domainEvents[0].payload.parentId).toBeNull();
		});

		it("delete() emits a NodeDeletedEvent", () => {
			const node = new Chapter(
				NodeFactory.createRecord("CHAPTER", null, userId),
			);
			node.delete();
			const events = node.domainEvents;
			expect(events).toHaveLength(1);
			expect(events[0].type).toBe(NODE_DELETED);
			expect(events[0].payload).toMatchObject({ id: node.id });
		});

		it("clearDomainEvents() drains the event queue", () => {
			const node = new Chapter(
				NodeFactory.createRecord("CHAPTER", null, userId),
			);
			node.rename("X");
			node.move("p");
			expect(node.domainEvents).toHaveLength(2);
			node.clearDomainEvents();
			expect(node.domainEvents).toHaveLength(0);
		});
	});
});
