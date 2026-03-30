import { useStore } from "@nanostores/react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import type { SyncStatus } from "../components/NoteHeader";
import { syncService } from "../store/noteStore";
import { $isLocked, cryptoService } from "../store/vaultStore";
import { api } from "../utils/api";

export const useEncryptedSync = (
	activeNodeId: string | null,
	debounceMs: number = 5000,
) => {
	const isLocked = useStore($isLocked);
	const [syncStatus, setSyncStatus] = useState<SyncStatus>("saved");
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const pendingUpdatesRef = useRef<Uint8Array[]>([]);

	// --- Initial Fetch & Decrypt ---
	useEffect(() => {
		if (isLocked || !activeNodeId) return;

		const fetchAndApply = async () => {
			setSyncStatus("saving");
			try {
				const rawUpdates = await api.getUpdates(activeNodeId);
				console.log(
					`[Sync] Fetched ${rawUpdates.length} encrypted updates for ${activeNodeId}`,
				);

				const decryptedUpdates: Uint8Array[] = [];
				for (const raw of rawUpdates) {
					try {
						const payload = cryptoService.deserializePayload(raw);
						const decrypted = await cryptoService.decryptDelta(payload);
						decryptedUpdates.push(decrypted);
					} catch (e) {
						console.error("Failed to decrypt update", e);
					}
				}

				if (decryptedUpdates.length > 0) {
					for (const dec of decryptedUpdates) {
						syncService.applyUpdate(dec, "remote-sync");
					}
				}

				setSyncStatus("saved");
			} catch (error) {
				console.error("Failed to fetch/decrypt updates:", error);
				setSyncStatus("unsaved");
			}
		};

		fetchAndApply();
	}, [isLocked, activeNodeId]);

	const performSync = useCallback(async () => {
		if (isLocked || !activeNodeId || pendingUpdatesRef.current.length === 0)
			return;

		setSyncStatus("saving");
		try {
			const updates = pendingUpdatesRef.current;
			pendingUpdatesRef.current = [];

			// Merge updates into one for efficiency
			const mergedUpdate = Y.mergeUpdates(updates);

			// 1. Encrypt the update (Incremental Yjs delta)
			const encryptedPayload = await cryptoService.encryptDelta(mergedUpdate);
			const serialized = cryptoService.serializePayload(encryptedPayload);

			// 2. Real API push
			await api.pushUpdate(activeNodeId, serialized);

			setSyncStatus("saved");
		} catch (error) {
			console.error("Encrypted sync failed:", error);
			setSyncStatus("unsaved");
		}
	}, [isLocked, activeNodeId]);

	const markChanged = useCallback(
		(update: Uint8Array) => {
			if (isLocked) return;

			setSyncStatus("unsaved");
			pendingUpdatesRef.current.push(update);

			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}

			timerRef.current = setTimeout(() => {
				performSync();
			}, debounceMs);
		},
		[isLocked, performSync, debounceMs],
	);

	const syncNow = useCallback(() => {
		if (syncStatus === "saved" || syncStatus === "saving" || isLocked) return;

		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		performSync();
	}, [syncStatus, isLocked, performSync]);

	// Handle Ctrl+S / Cmd+S
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				syncNow();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [syncNow]);

	// Observe Yjs document changes
	useEffect(() => {
		const observer = (update: Uint8Array, origin: any) => {
			// In E2E tests, the origin might be different or null, let's explicitly accept E2E
			if (origin !== null && origin !== undefined && origin !== 'local-update' && origin !== 'e2e') return;
			markChanged(update);
		};

		syncService.ydoc.on("update", observer);
		return () => syncService.ydoc.off("update", observer);
	}, [markChanged]);

	return { syncStatus, markChanged, syncNow };
};
