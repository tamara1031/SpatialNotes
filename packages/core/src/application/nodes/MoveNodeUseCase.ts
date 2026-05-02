import {
	globalEventBus,
	type IDomainEventBus,
} from "../../domain/events/DomainEventBus.js";
import { NodeNotFoundError } from "../../domain/nodes/errors.js";
import type { INodeRepository } from "../../domain/nodes/INodeRepository.js";
import { CircularReferenceError } from "../../domain/types.js";
import { publishAndClear } from "./publishAndClear.js";

export interface MoveNodeInput {
	id: string;
	newParentId: string | null;
}

export class MoveNodeUseCase {
	constructor(
		private readonly nodeRepository: INodeRepository,
		private readonly eventBus: IDomainEventBus = globalEventBus,
	) {}

	async execute(input: MoveNodeInput): Promise<void> {
		const node = await this.nodeRepository.findById(input.id);
		if (!node) {
			throw new NodeNotFoundError(input.id);
		}

		// Guard against circular references by traversing ancestors via persistence.
		if (input.newParentId) {
			let currentId: string | null = input.newParentId;
			const visited = new Set<string>();

			while (currentId) {
				if (currentId === input.id || visited.has(currentId)) {
					throw new CircularReferenceError();
				}

				visited.add(currentId);
				const parent = await this.nodeRepository.findById(currentId);
				if (!parent) {
					throw new NodeNotFoundError(currentId);
				}
				currentId = parent.toRecord().parentId;
			}
		}

		node.move(input.newParentId);
		await this.nodeRepository.save(node);
		publishAndClear(node, this.eventBus);
	}
}
