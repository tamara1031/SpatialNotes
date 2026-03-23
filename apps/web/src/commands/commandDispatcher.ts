import * as Commands from "@spatial-notes/core";
import type { Map as YMap } from "yjs";

/**
 * Context required for executing domain commands on the Yjs doc.
 */
export interface CommandContext {
	elementsMap: YMap<any>;
	nodesMap: YMap<any>;
}

/**
 * Central dispatcher for Yjs-backed domain commands.
 * Decouples the UI shell from specific command instantiation.
 */
export const dispatchCommand = (
	type: string,
	payload: any,
	context: CommandContext,
) => {
	const { elementsMap, nodesMap } = context;

	switch (type) {
		case "CREATE":
			new Commands.CreateElementCommand(elementsMap, payload).execute();
			break;
		case "DELETE":
			new Commands.DeleteElementCommand(
				elementsMap,
				payload.id || payload,
			).execute();
			break;
		case "UPDATE_ELEMENTS":
			new Commands.UpdateElementsCommand(elementsMap, payload).execute();
			break;
		case "UPDATE_NODE":
			new Commands.UpdateNodeCommand(nodesMap, payload).execute();
			break;
		case "BATCH":
			elementsMap.doc?.transact(() => {
				const subCommands = Array.isArray(payload) ? payload : [];
				subCommands.forEach((subCmd: any) =>
					dispatchCommand(subCmd.type, subCmd.payload, context),
				);
			});
			break;
		default:
			console.warn(`Unknown command type: ${type}`);
	}
};
