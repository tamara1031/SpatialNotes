import { describe, expect, it, vi } from "vitest";
import { NODE_MOVED } from "../../domain/nodes/events.js";
import { CircularReferenceError } from "../../domain/types.js";
import { MoveNodeUseCase } from "./MoveNodeUseCase.js";

const makeNode = (
	id: string,
	parentId: string | null,
): {
	id: string;
	move: ReturnType<typeof vi.fn>;
	domainEvents: {
		type: string;
		payload: { id: string; parentId: string | null };
		occurredAt: number;
	}[];
	clearDomainEvents: ReturnType<typeof vi.fn>;
	toRecord: () => { parentId: string | null };
} => ({
	id,
	move: vi.fn(),
	domainEvents: [
		{ type: NODE_MOVED, payload: { id, parentId }, occurredAt: Date.now() },
	],
	clearDomainEvents: vi.fn(),
	toRecord: () => ({ parentId }),
});

describe("MoveNodeUseCase", () => {
	it("should move a node and publish the entity's NodeMovedEvent", async () => {
		const node = makeNode("n1", null);

		const repo = {
			findById: vi.fn().mockResolvedValue(node),
			save: vi.fn().mockResolvedValue(undefined),
		} as any;

		const mockBus = { publish: vi.fn() };
		const useCase = new MoveNodeUseCase(repo, mockBus);

		await useCase.execute({ id: "n1", newParentId: "p1" });

		expect(node.move).toHaveBeenCalledWith("p1");
		expect(repo.save).toHaveBeenCalledWith(node);
		expect(mockBus.publish).toHaveBeenCalledTimes(1);
		expect(mockBus.publish.mock.calls[0][0].type).toBe(NODE_MOVED);
		expect(node.clearDomainEvents).toHaveBeenCalled();
	});

	it("should move a node to root (null parent) and publish event", async () => {
		const node = makeNode("n1", "old-parent");

		const repo = {
			findById: vi.fn().mockResolvedValue(node),
			save: vi.fn().mockResolvedValue(undefined),
		} as any;

		const mockBus = { publish: vi.fn() };
		const useCase = new MoveNodeUseCase(repo, mockBus);

		await useCase.execute({ id: "n1", newParentId: null });

		expect(node.move).toHaveBeenCalledWith(null);
		expect(mockBus.publish).toHaveBeenCalledTimes(1);
	});

	it("should throw if node not found", async () => {
		const repo = {
			findById: vi.fn().mockResolvedValue(null),
		} as any;

		const useCase = new MoveNodeUseCase(repo);

		await expect(
			useCase.execute({ id: "missing", newParentId: "p1" }),
		).rejects.toThrow("Node not found: missing");
	});

	it("should throw CircularReferenceError when target is a descendant", async () => {
		// n1 → n2 → n3; trying to move n1 under n3 would be circular.
		const n1 = makeNode("n1", null);
		const n2 = makeNode("n2", "n1");
		const n3 = makeNode("n3", "n2");

		const repo = {
			findById: vi.fn().mockImplementation((id: string) => {
				if (id === "n1") return Promise.resolve(n1);
				if (id === "n2") return Promise.resolve(n2);
				if (id === "n3") return Promise.resolve(n3);
				return Promise.resolve(null);
			}),
			save: vi.fn(),
		} as any;

		const useCase = new MoveNodeUseCase(repo);

		await expect(
			useCase.execute({ id: "n1", newParentId: "n3" }),
		).rejects.toThrow(CircularReferenceError);
	});

	it("should throw CircularReferenceError when target is the node itself", async () => {
		const node = makeNode("n1", null);

		const repo = {
			findById: vi.fn().mockResolvedValue(node),
			save: vi.fn(),
		} as any;

		const useCase = new MoveNodeUseCase(repo);

		await expect(
			useCase.execute({ id: "n1", newParentId: "n1" }),
		).rejects.toThrow(CircularReferenceError);
	});
});
