import { describe, expect, it, vi } from "vitest";
import { CircularReferenceError } from "../../domain/types";
import { MoveNodeUseCase } from "./MoveNodeUseCase";

describe("MoveNodeUseCase", () => {
	it("should move a node and publish a NodeMovedEvent", async () => {
		const mockNode = {
			id: "n1",
			move: vi.fn(),
		};

		const repo = {
			findById: vi.fn().mockImplementation(async (id) => {
				if (id === "n1") return mockNode;
				if (id === "p1")
					return { id: "p1", toRecord: () => ({ parentId: null }) };
				return null;
			}),
			save: vi.fn().mockResolvedValue(undefined),
		} as any;

		const mockEventBus = { publish: vi.fn() } as any;
		const useCase = new MoveNodeUseCase(repo, mockEventBus);

		await useCase.execute({ id: "n1", newParentId: "p1" });

		expect(mockNode.move).toHaveBeenCalledWith("p1");
		expect(repo.save).toHaveBeenCalledWith(mockNode);
		expect(mockEventBus.publish).toHaveBeenCalled();
	});

	it("should throw an error if the node is not found", async () => {
		const repo = {
			findById: vi.fn().mockResolvedValue(null),
		} as any;

		const mockEventBus = { publish: vi.fn() } as any;
		const useCase = new MoveNodeUseCase(repo, mockEventBus);

		await expect(
			useCase.execute({ id: "unknown", newParentId: "p1" }),
		).rejects.toThrow("Node not found: unknown");
	});

	it("should throw a CircularReferenceError if trying to move a node to its own descendant", async () => {
		const mockNode = { id: "n1", move: vi.fn() };
		const childNode = { id: "c1", toRecord: () => ({ parentId: "n1" }) };

		const repo = {
			findById: vi.fn().mockImplementation(async (id) => {
				if (id === "n1") return mockNode;
				if (id === "c1") return childNode;
				return null;
			}),
		} as any;

		const mockEventBus = { publish: vi.fn() } as any;
		const useCase = new MoveNodeUseCase(repo, mockEventBus);

		await expect(
			useCase.execute({ id: "n1", newParentId: "c1" }),
		).rejects.toThrow(CircularReferenceError);
	});
});
