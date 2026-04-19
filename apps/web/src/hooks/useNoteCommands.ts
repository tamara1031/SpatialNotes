import { useCallback } from "react";
import { dispatchCommand } from "../commands/commandDispatcher";
import type { EngineCommand } from "../commands/types";
import { elementsMap, nodesMap } from "../store/noteStore";

export const useNoteCommands = (
	activeNodeId: string | null,
	markChanged: () => void,
) => {
	const handleCommand = useCallback(
		(cmd: EngineCommand) => {
			if (!activeNodeId) return;
			dispatchCommand(cmd, {
				elementsMap,
				nodesMap,
			});
			markChanged();
		},
		[activeNodeId, markChanged],
	);

	return { handleCommand };
};
