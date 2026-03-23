import { describe, expect, it, vi } from "vitest";
import { VaultStatus } from "../../domain/vault/VaultStatus";
import { CreateNodeUseCase } from "./CreateNodeUseCase";

describe("CreateNodeUseCase", () => {
	it("should throw error if vault is locked", async () => {
		const repo = { save: vi.fn() } as any;
		const vault = { getStatus: () => VaultStatus.Locked() } as any;
		const useCase = new CreateNodeUseCase(repo, vault);

		await expect(
			useCase.execute({
				parentId: null,
				name: "New",
				type: "chapter",
				userId: "u1",
			}),
		).rejects.toThrow("Vault is locked");
	});

	it("should save a new node if vault is unlocked", async () => {
		const repo = { save: vi.fn() } as any;
		const vault = { getStatus: () => VaultStatus.Unlocked() } as any;
		const useCase = new CreateNodeUseCase(repo, vault);

		await useCase.execute({
			parentId: "p1",
			name: "My Notebook",
			type: "notebook",
			userId: "u1",
		});

		expect(repo.save).toHaveBeenCalled();
		const savedNode = repo.save.mock.calls[0][0];
		expect(savedNode.name).toBe("My Notebook");
		expect(savedNode.type).toBe("NOTEBOOK");
	});
});
