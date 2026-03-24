import { useStore } from "@nanostores/react";
import { NodeFactory, type NodeRecord } from "@spatial-notes/core";
import type React from "react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { getEngineView } from "../engines/engineRegistry";
import { useEncryptedSync } from "../hooks/useEncryptedSync";
import { useNoteCommands } from "../hooks/useNoteCommands";
import { useNoteHistory } from "../hooks/useNoteHistory";
import { useNoteMode } from "../hooks/useNoteMode";
import { useSync, useSyncMap } from "../hooks/useSync";
import { resetYDoc } from "../store/noteStore";
import {
	removeNotification,
	showNotification,
} from "../store/notificationStore";
import { $currentUser } from "../store/vaultStore";
import { NoteHeader } from "./NoteHeader";

interface EngineRef {
	handleKeyDown?: (e: KeyboardEvent) => boolean;
}

export const NoteViewShell: React.FC = () => {
	const currentUser = useStore($currentUser as any);
	const { activeNodeId } = useNoteMode();
	const [_engineStatus, setEngineStatus] = useState<
		"LOADING" | "READY" | "ERROR"
	>("LOADING");
	const errorNotificationId = useRef<string | null>(null);

	// Reset Yjs state when switching nodes to avoid crosstalk (ADR-016)
	useEffect(() => {
		if (activeNodeId) {
			resetYDoc();
			setEngineStatus("LOADING");
		}
	}, [activeNodeId]);

	const engineRef = useRef<EngineRef>(null);

	const { elementsMap, nodesMap, undoManager } = useSync();
	const elements = useSyncMap(elementsMap);
	const nodes = useSyncMap(nodesMap);

	const activeNode = activeNodeId ? (nodes[activeNodeId] as NodeRecord) : null;

	const { canUndo, canRedo, undo, redo } = useNoteHistory(undoManager);

	const debounceTime =
		typeof window !== "undefined" && (window as any).__E2E_SKIP_AUTH__
			? 100
			: 5000;

	const { syncStatus, syncNow } = useEncryptedSync(activeNodeId, debounceTime);
	const { handleCommand } = useNoteCommands(activeNodeId, () => {
		// Yjs observer in useEncryptedSync will handle the actual data push.
		// We just need to ensure the UI shows "unsaved" immediately if desired,
		// though the observer also does that.
	});

	// Global Key Handling (e.g. for selection/deletion in engine)
	useEffect(() => {
		const handleGlobalKeyDown = (e: KeyboardEvent) => {
			if (engineRef.current?.handleKeyDown?.(e)) {
				return;
			}
		};
		window.addEventListener("keydown", handleGlobalKeyDown);
		return () => window.removeEventListener("keydown", handleGlobalKeyDown);
	}, []);

	// Data Loss Prevention (UX)
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (syncStatus === "saving") {
				e.preventDefault();
				e.returnValue = "";
			}
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [syncStatus]);

	const handleAction = useCallback(
		(action: { type: string; payload?: any }) => {
			console.log(`[NoteViewShell] Action: ${action.type}`, action.payload);
			if (action.type === "STATUS") {
				setEngineStatus(action.payload);
				if (action.payload === "ERROR") {
					errorNotificationId.current = showNotification(
						`Engine error: ${action.payload.error || "Unknown error"}`,
						"error",
					);
				} else if (action.payload === "READY" && errorNotificationId.current) {
					removeNotification(errorNotificationId.current);
					errorNotificationId.current = null;
				}
			}
		},
		[],
	);

	const engineType = (activeNode?.metadata?.engineType as string) || "CANVAS";

	if (!activeNodeId) {
		return (
			<div
				style={{
					flex: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "rgba(255,255,255,0.2)",
				}}
			>
				<h2>Select a note to get started</h2>
			</div>
		);
	}

	return (
		<div
			style={{
				flex: 1,
				display: "flex",
				flexDirection: "column",
				height: "100%",
				overflow: "hidden",
			}}
		>
			<NoteHeader
				name={activeNode?.name || "Untitled"}
				updatedAt={activeNode?.updatedAt || 0}
				syncStatus={syncStatus}
				encryptionStrategy={activeNode?.encryptionStrategy || "STANDARD"}
				onSave={syncNow}
				onEncryptionChange={(strategy) =>
					handleCommand({ type: "UPDATE_ENCRYPTION", payload: strategy })
				}
			/>

			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					position: "relative",
				}}
			>
				<Suspense
					fallback={
						<div
							style={{
								position: "absolute",
								inset: 0,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								background: "var(--surface-base)",
								zIndex: 10,
							}}
						>
							<div className="spinner">Loading Engine...</div>
						</div>
					}
				>
					{(() => {
						const EngineView = getEngineView(engineType);
						return (
							<EngineView
								ref={engineRef}
								activeNodeId={activeNodeId}
								elements={Object.values(elements) as NodeRecord[]}
								onCommand={handleCommand}
								onAction={handleAction}
								onUndo={undo}
								onRedo={redo}
								canUndo={canUndo}
								canRedo={canRedo}
								elementFactory={(
									type: string,
									parentId: string,
									metadata: Record<string, unknown>,
								) =>
									NodeFactory.createRecord(
										type as any,
										parentId,
										currentUser?.id || "anonymous",
										metadata,
									) as NodeRecord
								}
							/>
						);
					})()}
				</Suspense>
			</div>
		</div>
	);
};
