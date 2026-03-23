import type { IDomainEvent } from "../events/DomainEventBus";
import type { NodeRecord } from "../types";

export const NODE_CREATED = "node.created";
export const NODE_RENAMED = "node.renamed";
export const NODE_MOVED = "node.moved";
export const NODE_DELETED = "node.deleted";

export class NodeCreatedEvent implements IDomainEvent<NodeRecord> {
	type = NODE_CREATED;
	occurredAt = Date.now();
	constructor(public payload: NodeRecord) {}
}

export class NodeRenamedEvent
	implements IDomainEvent<{ id: string; name: string }>
{
	type = NODE_RENAMED;
	occurredAt = Date.now();
	constructor(public payload: { id: string; name: string }) {}
}

export class NodeMovedEvent
	implements IDomainEvent<{ id: string; parentId: string | null }>
{
	type = NODE_MOVED;
	occurredAt = Date.now();
	constructor(public payload: { id: string; parentId: string | null }) {}
}

export class NodeDeletedEvent implements IDomainEvent<{ id: string }> {
	type = NODE_DELETED;
	occurredAt = Date.now();
	constructor(public payload: { id: string }) {}
}
