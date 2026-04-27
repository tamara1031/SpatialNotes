import * as Y from "yjs";
import { describe, expect, it } from "vitest";
import { NodeFactory } from "../../domain/nodes/NodeFactory.js";
import { YjsNodeRepository } from "./YjsNodeRepository.js";

const userId = "user-1";
const otherUserId = "user-2";

function makeRepo() {
	return new YjsNodeRepository(new Y.Doc());
}

describe("YjsNodeRepository", () => {
	describe("save and findById", () => {
		it("returns null for unknown id", async () => {
			const repo = makeRepo();
			expect(await repo.findById("missing")).toBeNull();
		});

		it("round-trips a saved node", async () => {
			const repo = makeRepo();
			const record = NodeFactory.createRecord("CHAPTER", null, userId, {}, "Root");
			const node = NodeFactory.create(record);
			await repo.save(node);
			const found = await repo.findById(node.id);
			expect(found).not.toBeNull();
			expect(found?.id).toBe(node.id);
			expect(found?.name).toBe("Root");
		});

		it("findById returns a soft-deleted node (caller decides visibility)", async () => {
			const repo = makeRepo();
			const record = NodeFactory.createRecord("CHAPTER", null, userId, {}, "Deleted");
			const node = NodeFactory.create(record);
			node.delete();
			await repo.save(node);
			const found = await repo.findById(node.id);
			expect(found?.isDeleted).toBe(true);
		});
	});

	describe("findAll", () => {
		it("returns only nodes for the requested user", async () => {
			const repo = makeRepo();
			const mine = NodeFactory.create(NodeFactory.createRecord("CHAPTER", null, userId, {}, "Mine"));
			const theirs = NodeFactory.create(NodeFactory.createRecord("CHAPTER", null, otherUserId, {}, "Theirs"));
			await repo.save(mine);
			await repo.save(theirs);

			const result = await repo.findAll(userId);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(mine.id);
		});

		it("excludes soft-deleted nodes", async () => {
			const repo = makeRepo();
			const active = NodeFactory.create(NodeFactory.createRecord("CHAPTER", null, userId, {}, "Active"));
			const deleted = NodeFactory.create(NodeFactory.createRecord("CHAPTER", null, userId, {}, "Deleted"));
			deleted.delete();
			await repo.save(active);
			await repo.save(deleted);

			const result = await repo.findAll(userId);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(active.id);
		});

		it("returns empty array when no nodes exist for user", async () => {
			const repo = makeRepo();
			expect(await repo.findAll(userId)).toEqual([]);
		});
	});

	describe("findByParentId", () => {
		it("returns children with matching parentId for the user", async () => {
			const repo = makeRepo();
			const parent = NodeFactory.create(NodeFactory.createRecord("CHAPTER", null, userId, {}, "Parent"));
			const child = NodeFactory.create(NodeFactory.createRecord("NOTEBOOK", parent.id, userId, {}, "Child"));
			await repo.save(parent);
			await repo.save(child);

			const result = await repo.findByParentId(parent.id, userId);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(child.id);
		});

		it("excludes soft-deleted children", async () => {
			const repo = makeRepo();
			const parent = NodeFactory.create(NodeFactory.createRecord("CHAPTER", null, userId, {}, "Parent"));
			const active = NodeFactory.create(NodeFactory.createRecord("NOTEBOOK", parent.id, userId, {}, "Active"));
			const deleted = NodeFactory.create(NodeFactory.createRecord("NOTEBOOK", parent.id, userId, {}, "Deleted"));
			deleted.delete();
			await repo.save(parent);
			await repo.save(active);
			await repo.save(deleted);

			const result = await repo.findByParentId(parent.id, userId);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(active.id);
		});

		it("returns root nodes when parentId is null", async () => {
			const repo = makeRepo();
			const root = NodeFactory.create(NodeFactory.createRecord("CHAPTER", null, userId, {}, "Root"));
			const child = NodeFactory.create(NodeFactory.createRecord("NOTEBOOK", root.id, userId, {}, "Child"));
			await repo.save(root);
			await repo.save(child);

			const roots = await repo.findByParentId(null, userId);
			expect(roots).toHaveLength(1);
			expect(roots[0].id).toBe(root.id);
		});
	});
});
