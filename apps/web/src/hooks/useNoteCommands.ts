import { useCallback } from "react";
import { dispatchCommand } from "../commands/commandDispatcher";
import { elementsMap, nodesMap } from "../store/noteStore";

export const useNoteCommands = (
	activeNodeId: string | null,
	markChanged: () => void,
) => {
	const handleCommand = useCallback(
		(cmd: any) => {
			if (!activeNodeId) return;
			dispatchCommand(cmd.type, cmd.payload, {
				elementsMap: elementsMap as any,
				nodesMap: nodesMap as any,
			});
			markChanged();
		},
		[activeNodeId, markChanged],
	);

	return { handleCommand };
};
