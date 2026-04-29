import type { IDomainEventBus } from "../../domain/events/DomainEventBus.js";
import type { Node } from "../../domain/nodes/Node.js";

/**
 * Publishes all domain events collected by a node entity, then clears them.
 * Centralises the boilerplate that would otherwise be repeated in every use case.
 */
export function publishAndClear(node: Node, eventBus: IDomainEventBus): void {
	for (const event of node.domainEvents) {
		eventBus.publish(event);
	}
	node.clearDomainEvents();
}
