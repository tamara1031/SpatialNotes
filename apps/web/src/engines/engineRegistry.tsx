import type { ElementFactory } from "engine-core";
import type React from "react";
import { lazy } from "react";

/**
 * Common props passed to every engine view.
 * Types are intentionally loose (any) at this boundary layer so
 * engine packages don't need to cross-reference each other's types.
 */
export interface EngineViewProps {
	ref?: React.Ref<any>;
	activeNodeId: string;
	elements: any[];
	onCommand: (cmd: any) => void;
	onAction?: (action: { type: string; payload?: any }) => void;
	onUndo?: () => void;
	onRedo?: () => void;
	canUndo: boolean;
	canRedo: boolean;
	elementFactory: ElementFactory<any>;
}

/**
 * Lazy-loading engine registry.
 * Each engine is its own dynamic import chunk — zero cost until first use.
 */
export const EngineRegistry: Record<
	string,
	React.LazyExoticComponent<React.FC<EngineViewProps>>
> = {
	CANVAS: lazy(() =>
		import("canvas-engine").then((m) => ({
			default: m.CanvasView as React.FC<EngineViewProps>,
		})),
	),
	MARKDOWN: lazy(() =>
		import("markdown-engine").then((m) => ({
			default: m.MarkdownView as React.FC<EngineViewProps>,
		})),
	),
};

/**
 * Returns the lazy engine view component for a type, or a fallback UI.
 */
export const getEngineView = (
	type: string,
): React.ComponentType<EngineViewProps> => {
	const View = EngineRegistry[type.toUpperCase()];
	if (View) return View;

	const Fallback: React.FC<EngineViewProps> = () => (
		<div
			style={{
				flex: 1,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				color: "rgba(255,255,255,0.2)",
			}}
		>
			<h2>Engine &quot;{type}&quot; not implemented yet</h2>
		</div>
	);
	return Fallback;
};
