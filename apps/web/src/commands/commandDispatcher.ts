import {
	CreateElementCommand,
	DeleteElementCommand,
	type NodeRecord,
	UpdateElementsCommand,
	UpdateNodeCommand,
} from "@spatial-notes/core";
import type { Map as YMap } from "yjs";
import { YjsStoreAdapter } from "../infrastructure/storage/YjsStoreAdapter";
import type { EngineCommand } from "./types";

/**
 * Context required for executing engine commands against the Yjs doc.
 */
export interface CommandContext {
	elementsMap: YMap<NodeRecord>;
	nodesMap: YMap<NodeRecord>;
}

/**
 * Central dispatcher for engine-emitted commands (ADR-030).
 *
 * Maps each variant of the `EngineCommand` discriminated union to the
 * corresponding `@spatial-notes/core` Command and executes it. The dispatcher
 * owns Command instantiation and Yjs transaction boundaries; it does not
 * translate between vocabularies.
 */
export const dispatchCommand = (
	command: EngineCommand,
	context: CommandContext,
): void => {
	const elementsStore = new YjsStoreAdapter(context.elementsMap);
	const nodesStore = new YjsStoreAdapter(context.nodesMap);

	switch (command.type) {
		case "CREATE":
			new CreateElementCommand(elementsStore, command.payload).execute();
			return;
		case "DELETE":
			new DeleteElementCommand(elementsStore, command.payload.id).execute();
			return;
		case "UPDATE_ELEMENTS":
			new UpdateElementsCommand(elementsStore, command.payload).execute();
			return;
		case "UPDATE_NODE":
			new UpdateNodeCommand(nodesStore, command.payload).execute();
			return;
		case "BATCH":
			context.elementsMap.doc?.transact(() => {
				for (const sub of command.payload) {
					dispatchCommand(sub, context);
				}
			});
			return;
	}
};
