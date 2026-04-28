import {
	CreateElementCommand,
	DeleteElementCommand,
	globalEventBus,
	type IDomainEvent,
	NODE_CREATED,
	NODE_DELETED,
	NODE_RENAMED,
	type NodeRecord,
	UpdateNodeCommand,
} from "@spatial-notes/core";
import { YjsStoreAdapter } from "../../infrastructure/storage/YjsStoreAdapter";
import { nodesMap } from "../noteStore";

export class SyncService {
	private nodesAdapter = new YjsStoreAdapter(nodesMap);

	init() {
		// Node renaming
		globalEventBus.subscribe(
			NODE_RENAMED,
			(event: IDomainEvent<{ id: string; name: string }>) => {
				const { id, name } = event.payload;
				const command = new UpdateNodeCommand(this.nodesAdapter, { id, name });
				command.execute();
			},
		);

		// Node deletion
		globalEventBus.subscribe(
			NODE_DELETED,
			(event: IDomainEvent<{ id: string }>) => {
				const { id } = event.payload;
				const command = new DeleteElementCommand(this.nodesAdapter, id);
				command.execute();
			},
		);

		// Node creation
		globalEventBus.subscribe(
			NODE_CREATED,
			(event: IDomainEvent<NodeRecord>) => {
				const command = new CreateElementCommand(
					this.nodesAdapter,
					event.payload,
				);
				command.execute();
			},
		);
	}
}

export const domainSyncService = new SyncService();
