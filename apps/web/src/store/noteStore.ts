import { SyncService } from "@spatial-notes/core";
import * as Y from "yjs";

import { $activeNodeId } from "./nodes";

if (typeof window !== "undefined") {
	(window as any).$activeNodeId = $activeNodeId;
}

// --- Sync Service (Domain Service) ---
export const syncService = new SyncService({
	roomId: "default-room",
});

// --- Cross-tab live sync via BroadcastChannel ---
// Lets a second tab/window observe the same Y.Doc state without a websocket
// provider. Each tab broadcasts its local Yjs updates and applies updates
// received from peers. New tabs request a snapshot on open so they pick up
// state created before they were listening. The "broadcast" origin marker
// prevents echo loops.
if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
	const channel = new BroadcastChannel("spatial-notes-yjs");

	syncService.ydoc.on("update", (update: Uint8Array, origin: unknown) => {
		if (origin === "broadcast") return;
		channel.postMessage({ kind: "update", update });
	});

	channel.onmessage = (e: MessageEvent) => {
		const msg = e.data;
		if (msg?.kind === "update") {
			Y.applyUpdate(syncService.ydoc, msg.update, "broadcast");
		} else if (msg?.kind === "state") {
			Y.applyUpdate(syncService.ydoc, msg.state, "broadcast");
		} else if (msg?.kind === "request-state") {
			const state = Y.encodeStateAsUpdate(syncService.ydoc);
			channel.postMessage({ kind: "state", state });
		}
	};

	// Ask peers for their current state on startup.
	channel.postMessage({ kind: "request-state" });
}

// For debug/testing access in browser console
if (typeof window !== "undefined") {
	(window as any).syncService = syncService;
	(window as any).ydoc = syncService.ydoc;
}

// Map exports for convenience (optional, but maintains compatibility)
export const ydoc = syncService.ydoc;
export const elementsMap = syncService.getElementsMap();
export const nodesMap = syncService.getNodesMap();
export const undoManager = syncService.undoManager;

export const resetYDoc = () => syncService.reset();
