import { SyncService } from "@spatial-notes/core";
import { atom } from "nanostores";

// --- UI State ---
export const $activeNodeId = atom<string | null>(null);

if (typeof window !== "undefined") {
	(window as any).$activeNodeId = $activeNodeId;
}

// --- Sync Service (Domain Service) ---
export const syncService = new SyncService({
	roomId: "default-room",
});

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
