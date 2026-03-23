import { globalEventBus } from "../../domain/events/DomainEventBus";
import { NodeMovedEvent } from "../../domain/nodes/events";
import type { INodeRepository } from "../../domain/nodes/INodeRepository";
import { CircularReferenceError } from "../../domain/types";

export interface MoveNodeInput {
	id: string;
	newParentId: string | null;
}

export class MoveNodeUseCase {
	constructor(private readonly nodeRepository: INodeRepository) {}

	async execute(input: MoveNodeInput): Promise<void> {
		const node = await this.nodeRepository.findById(input.id);
		if (!node) {
			throw new Error(`Node not found: ${input.id}`);
		}

		// Circular reference check
		if (input.newParentId) {
			let currentId: string | null = input.newParentId;
			while (currentId) {
				if (currentId === input.id) {
					throw new CircularReferenceError();
				}
				const parent = await this.nodeRepository.findById(currentId);
				currentId = parent ? parent.toRecord().parentId : null;
			}
		}

		node.move(input.newParentId);
		await this.nodeRepository.save(node);

		globalEventBus.publish(
			new NodeMovedEvent({ id: input.id, parentId: input.newParentId }),
		);
	}
}
