import {
	globalEventBus,
	type IDomainEventBus,
} from "../../domain/events/DomainEventBus.js";
import { NodeNotFoundError } from "../../domain/nodes/errors.js";
import type { INodeRepository } from "../../domain/nodes/INodeRepository.js";
import { ValidationError } from "../../domain/types.js";

export interface RenameNodeInput {
	id: string;
	newName: string;
}

export class RenameNodeUseCase {
	constructor(
		private readonly nodeRepository: INodeRepository,
		private readonly eventBus: IDomainEventBus = globalEventBus,
	) {}

	async execute(input: RenameNodeInput): Promise<void> {
		const node = await this.nodeRepository.findById(input.id);
		if (!node) {
			throw new NodeNotFoundError(input.id);
		}

		if (!input.newName.trim()) {
			throw new ValidationError("Name cannot be empty");
		}

		node.rename(input.newName);
		await this.nodeRepository.save(node);

		// Publish collected domain events
		for (const event of node.domainEvents) {
			this.eventBus.publish(event);
		}
		node.clearDomainEvents();
	}
}
