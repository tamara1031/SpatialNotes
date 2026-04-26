import { describe, expect, it, vi } from "vitest";
import { globalEventBus } from "../../domain/events/DomainEventBus.js";
import { NODE_CREATED } from "../../domain/nodes/events.js";
import { ValidationError } from "../../domain/types.js";
import { VaultStatus } from "../../domain/vault/VaultStatus.js";
import { CreateNodeUseCase } from "./CreateNodeUseCase.js";

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

	it("should publish a NodeCreatedEvent after saving", async () => {
		const repo = { save: vi.fn() } as any;
		const vault = { getStatus: () => VaultStatus.Unlocked() } as any;
		const useCase = new CreateNodeUseCase(repo, vault);
		const publishSpy = vi.spyOn(globalEventBus, "publish");

		await useCase.execute({
			parentId: null,
			name: "My Chapter",
			type: "chapter",
			userId: "u1",
		});

		expect(publishSpy).toHaveBeenCalledTimes(1);
		expect(publishSpy.mock.calls[0][0].type).toBe(NODE_CREATED);
	});

	it("should accept container NodeType variants case-insensitively", async () => {
		const repo = { save: vi.fn() } as any;
		const vault = { getStatus: () => VaultStatus.Unlocked() } as any;
		const useCase = new CreateNodeUseCase(repo, vault);

		for (const type of ["chapter", "CHAPTER", "notebook", "NOTEBOOK"]) {
			repo.save.mockClear();
			await expect(
				useCase.execute({ parentId: null, name: "x", type, userId: "u1" }),
			).resolves.toBeUndefined();
			expect(repo.save).toHaveBeenCalledTimes(1);
		}
	});

	it("should accept element NodeType variants when required metadata is present", async () => {
		const repo = { save: vi.fn() } as any;
		const vault = { getStatus: () => VaultStatus.Unlocked() } as any;
		const useCase = new CreateNodeUseCase(repo, vault);

		const cases: { type: string; metadata: Record<string, unknown> }[] = [
			{
				type: "ELEMENT_STROKE",
				metadata: { points: [], color: "#000", width: 1, z_index: 0 },
			},
			{
				type: "ELEMENT_IMAGE",
				metadata: { src: "data:image/png;base64,abc", z_index: 0 },
			},
			{ type: "element_text", metadata: { content: "hello", z_index: 0 } },
		];

		for (const { type, metadata } of cases) {
			repo.save.mockClear();
			await expect(
				useCase.execute({
					parentId: null,
					name: "x",
					type,
					userId: "u1",
					metadata,
				}),
			).resolves.toBeUndefined();
			expect(repo.save).toHaveBeenCalledTimes(1);
		}
	});

	it("should throw ValidationError for unknown node types", async () => {
		const repo = { save: vi.fn() } as any;
		const vault = { getStatus: () => VaultStatus.Unlocked() } as any;
		const useCase = new CreateNodeUseCase(repo, vault);

		await expect(
			useCase.execute({
				parentId: null,
				name: "Bad",
				type: "UNKNOWN_TYPE",
				userId: "u1",
			}),
		).rejects.toThrow(ValidationError);

		expect(repo.save).not.toHaveBeenCalled();
	});
});
