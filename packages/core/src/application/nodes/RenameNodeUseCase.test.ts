import { describe, expect, it, vi } from "vitest";
import { globalEventBus } from "../../domain/events/DomainEventBus";
import { RenameNodeUseCase } from "./RenameNodeUseCase";

describe("RenameNodeUseCase", () => {
	it("should rename a node and publish collected events", async () => {
		const mockNode = {
			id: "n1",
			rename: vi.fn(),
			domainEvents: [
				{
					type: "node.renamed",
					payload: { id: "n1", name: "New Name" },
					occurredAt: Date.now(),
				},
			],
			clearDomainEvents: vi.fn(),
		};

		const repo = {
			findById: vi.fn().mockResolvedValue(mockNode),
			save: vi.fn().mockResolvedValue(undefined),
		} as any;

		const publishSpy = vi.spyOn(globalEventBus, "publish");
		const useCase = new RenameNodeUseCase(repo);

		await useCase.execute({ id: "n1", newName: "New Name" });

		expect(mockNode.rename).toHaveBeenCalledWith("New Name");
		expect(repo.save).toHaveBeenCalledWith(mockNode);
		expect(publishSpy).toHaveBeenCalled();
		expect(mockNode.clearDomainEvents).toHaveBeenCalled();
	});

	it("should throw error if node not found", async () => {
		const repo = {
			findById: vi.fn().mockResolvedValue(null),
		} as any;

		const useCase = new RenameNodeUseCase(repo);

		await expect(
			useCase.execute({ id: "unknown", newName: "New" }),
		).rejects.toThrow("Node not found: unknown");
	});

	it("should throw error if name is empty", async () => {
		const mockNode = { id: "n1" };
		const repo = { findById: vi.fn().mockResolvedValue(mockNode) } as any;
		const useCase = new RenameNodeUseCase(repo);

		await expect(useCase.execute({ id: "n1", newName: "  " })).rejects.toThrow(
			"Name cannot be empty",
		);
	});
});
