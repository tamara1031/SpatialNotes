import type { ElementUpdate, NodeRecord } from "@spatial-notes/core";

/**
 * Discriminated union of commands emitted by engines (canvas, markdown, …)
 * to the shell, per ADR-030.
 *
 * The shell (see `commandDispatcher.ts`) instantiates the appropriate
 * `@spatial-notes/core` Command for each variant and executes it against the
 * Yjs-backed store. Engines MUST NOT emit arbitrary types outside this union.
 */
export type EngineCommand =
	| { type: "CREATE"; payload: NodeRecord }
	| { type: "DELETE"; payload: { id: string } }
	| { type: "UPDATE_ELEMENTS"; payload: ElementUpdate[] }
	| { type: "UPDATE_NODE"; payload: Partial<NodeRecord> & { id: string } }
	| { type: "BATCH"; payload: EngineCommand[] };

export type EngineCommandType = EngineCommand["type"];
