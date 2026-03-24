import { useStore } from "@nanostores/react";
import type { LayoutMode, NoteTool, Orientation } from "@spatial-notes/core";
import { $activeNodeId } from "../store/noteStore";

export type { LayoutMode, NoteTool, Orientation };

export const useNoteMode = () => {
	const activeNodeId = useStore($activeNodeId);

	return {
		activeNodeId,
		setActiveNodeId: (id: string | null) => $activeNodeId.set(id),
	};
};
