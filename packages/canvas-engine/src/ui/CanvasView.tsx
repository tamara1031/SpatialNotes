import type { ElementFactory } from "engine-core";
import type React from "react";
import type { CanvasElement } from "../types";
import { CanvasEngineUI } from "./CanvasEngineUI";

export interface CanvasViewProps {
	activeNodeId: string | null;
	elements: CanvasElement[];
	onCommand: (cmd: any) => void;
	onUndo: () => void;
	onRedo: () => void;
	canUndo: boolean;
	canRedo: boolean;
	elementFactory: ElementFactory;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
	activeNodeId,
	elements,
	onCommand,
	onUndo,
	onRedo,
	canUndo,
	canRedo,
	elementFactory,
}) => {
	return (
		<CanvasEngineUI
			activeNodeId={activeNodeId || ""}
			elements={elements}
			onCommand={onCommand}
			onUndo={onUndo}
			onRedo={onRedo}
			canUndo={canUndo}
			canRedo={canRedo}
			elementFactory={elementFactory}
		/>
	);
};
