import { describe, expect, it, vi } from "vitest";
import { DeleteNodeUseCase } from "./DeleteNodeUseCase";

describe("DeleteNodeUseCase", () => {
	it("should delete node and children if user is authorized", async () => {
		const mockRoot = {
			id: "root",
			userId: "u1",
			delete: vi.fn(),
			domainEvents: [
				{
					type: "node.deleted",
					payload: { id: "root" },
					occurredAt: Date.now(),
				},
			],
			clearDomainEvents: vi.fn(),
		};
		const mockChild = {
			id: "c1",
			userId: "u1",
			delete: vi.fn(),
			domainEvents: [
				{ type: "node.deleted", payload: { id: "c1" }, occurredAt: Date.now() },
			],
			clearDomainEvents: vi.fn(),
		};

		const repo = {
			findById: vi.fn().mockImplementation(async (id) => {
				if (id === "root") return mockRoot;
				if (id === "c1") return mockChild;
				return null;
			}),
			findByParentId: vi.fn().mockImplementation(async (pid) => {
				if (pid === "root") return [mockChild];
				return [];
			}),
			save: vi.fn(),
		} as any;

		const mockEventBus = { publish: vi.fn() } as any;
		const useCase = new DeleteNodeUseCase(repo, mockEventBus);

		await useCase.execute({ id: "root", userId: "u1" });

		expect(mockRoot.delete).toHaveBeenCalled();
		expect(mockChild.delete).toHaveBeenCalled();
		expect(repo.save).toHaveBeenCalledTimes(2);
		expect(mockEventBus.publish).toHaveBeenCalledTimes(2);
		expect(mockRoot.clearDomainEvents).toHaveBeenCalled();
	});

	it("should throw error if node not found", async () => {
		const repo = {
			findById: vi.fn().mockResolvedValue(null),
		} as any;

		const mockEventBus = { publish: vi.fn() } as any;
		const useCase = new DeleteNodeUseCase(repo, mockEventBus);

		await expect(
			useCase.execute({ id: "unknown", userId: "u1" }),
		).rejects.toThrow("Node not found: unknown");
	});

	it("should throw error if user is unauthorized", async () => {
		const repo = {
			findById: vi.fn().mockResolvedValue({ id: "n1", userId: "owner" }),
		} as any;

		const mockEventBus = { publish: vi.fn() } as any;
		const useCase = new DeleteNodeUseCase(repo, mockEventBus);

		await expect(
			useCase.execute({ id: "n1", userId: "hacker" }),
		).rejects.toThrow("Unauthorized to delete this node");
	});
});
