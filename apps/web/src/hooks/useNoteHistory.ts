import { useEffect, useState } from "react";
import type { UndoManager } from "yjs";

export const useNoteHistory = (undoManager: UndoManager) => {
	const [state, setState] = useState({
		canUndo: false,
		canRedo: false,
	});

	useEffect(() => {
		const observer = () => {
			setState({
				canUndo: undoManager.undoStack.length > 0,
				canRedo: undoManager.redoStack.length > 0,
			});
		};
		undoManager.on("stack-item-added", observer);
		undoManager.on("stack-item-popped", observer);
		// Initial check
		observer();

		return () => {
			undoManager.off("stack-item-added", observer);
			undoManager.off("stack-item-popped", observer);
		};
	}, [undoManager]);

	return {
		...state,
		undo: () => undoManager.undo(),
		redo: () => undoManager.redo(),
	};
};
