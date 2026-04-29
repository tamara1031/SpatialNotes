import { describe, expect, it, vi } from "vitest";
import {
	NodeNotFoundError,
	NodeOwnershipError,
} from "../../domain/nodes/errors.js";
import { DeleteNodeUseCase } from "./DeleteNodeUseCase.js";

describe("DeleteNodeUseCase", () => {
	it("should delete a node and its descendants and publish events", async () => {
		const mockNode = {
			id: "n1",
			userId: "u1",
			delete: vi.fn(),
			domainEvents: [
				{ type: "node.deleted", payload: { id: "n1" }, occurredAt: Date.now() },
			],
			clearDomainEvents: vi.fn(),
		};

		const mockChild = {
			id: "n2",
			userId: "u1",
			delete: vi.fn(),
			domainEvents: [
				{ type: "node.deleted", payload: { id: "n2" }, occurredAt: Date.now() },
			],
			clearDomainEvents: vi.fn(),
		};

		const repo = {
			findById: vi.fn().mockImplementation((id) => {
				if (id === "n1") return Promise.resolve(mockNode);
				if (id === "n2") return Promise.resolve(mockChild);
				return Promise.resolve(null);
			}),
			findByParentId: vi.fn().mockImplementation((parentId) => {
				if (parentId === "n1") return Promise.resolve([mockChild]);
				return Promise.resolve([]);
			}),
			save: vi.fn().mockResolvedValue(undefined),
		} as any;

		const mockBus = { publish: vi.fn() };
		const useCase = new DeleteNodeUseCase(repo, mockBus);

		await useCase.execute({ id: "n1", userId: "u1" });

		expect(mockNode.delete).toHaveBeenCalled();
		expect(mockChild.delete).toHaveBeenCalled();
		expect(repo.save).toHaveBeenCalledTimes(2);
		expect(mockBus.publish).toHaveBeenCalledTimes(2);
	});

	it("should throw NodeNotFoundError if node not found", async () => {
		const repo = {
			findById: vi.fn().mockResolvedValue(null),
		} as any;

		const useCase = new DeleteNodeUseCase(repo);

		await expect(
			useCase.execute({ id: "unknown", userId: "u1" }),
		).rejects.toThrow(NodeNotFoundError);
	});

	it("should throw NodeOwnershipError if caller does not own node", async () => {
		const mockNode = {
			id: "n1",
			userId: "other",
		};

		const repo = {
			findById: vi.fn().mockResolvedValue(mockNode),
		} as any;

		const useCase = new DeleteNodeUseCase(repo);

		await expect(useCase.execute({ id: "n1", userId: "u1" })).rejects.toThrow(
			NodeOwnershipError,
		);
	});
});
