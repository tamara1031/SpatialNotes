import {
	CreateElementCommand,
	DeleteElementCommand,
	type NodeRecord,
	UpdateElementsCommand,
	UpdateNodeCommand,
} from "@spatial-notes/core";
import type { Map as YMap } from "yjs";
import { YjsStoreAdapter } from "../infrastructure/storage/YjsStoreAdapter";

/**
 * Context required for executing domain commands on the Yjs doc.
 */
export interface CommandContext {
	elementsMap: YMap<any>;
	nodesMap: YMap<NodeRecord>;
}

/**
 * Central dispatcher for Yjs-backed domain commands.
 * Decouples the UI shell from specific command instantiation.
 */
export const dispatchCommand = (
	type: string,
	payload: unknown,
	context: CommandContext,
) => {
	const elementsStore = new YjsStoreAdapter(context.elementsMap);
	const nodesStore = new YjsStoreAdapter(context.nodesMap);

	switch (type) {
		case "CREATE":
			new CreateElementCommand(elementsStore, payload as NodeRecord).execute();
			break;
		case "DELETE":
			new DeleteElementCommand(
				elementsStore,
				(payload as any).id || (payload as string),
			).execute();
			break;
		case "UPDATE_ELEMENTS":
			new UpdateElementsCommand(
				elementsStore,
				payload as NodeRecord[],
			).execute();
			break;
		case "UPDATE_NODE":
			new UpdateNodeCommand(
				nodesStore,
				payload as Partial<NodeRecord> & { id: string },
			).execute();
			break;
		case "BATCH":
			context.elementsMap.doc?.transact(() => {
				const subCommands = Array.isArray(payload) ? payload : [];
				for (const subCmd of subCommands) {
					dispatchCommand(
						(subCmd as any).type,
						(subCmd as any).payload,
						context,
					);
				}
			});
			break;
		default:
			console.warn(`Unknown command type: ${type}`);
	}
};
