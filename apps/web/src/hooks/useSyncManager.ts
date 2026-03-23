import { useCallback, useEffect, useRef, useState } from "react";
import type { SyncStatus } from "../components/NoteHeader";

export const useSyncManager = (
	pushDelta: () => Promise<boolean>,
	debounceMs: number = 5000,
) => {
	const [syncStatus, setSyncStatus] = useState<SyncStatus>("saved");
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const performPush = useCallback(async () => {
		setSyncStatus("saving");
		try {
			const success = await pushDelta();
			if (success) {
				setSyncStatus("saved");
			} else {
				setSyncStatus("unsaved"); // Or 'error' state if we add one
			}
		} catch (error) {
			console.error("Sync failed:", error);
			setSyncStatus("unsaved");
		}
	}, [pushDelta]);

	const markChanged = useCallback(() => {
		setSyncStatus("unsaved");
		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}
		timerRef.current = setTimeout(() => {
			performPush();
		}, debounceMs);
	}, [performPush, debounceMs]);

	const syncNow = useCallback(() => {
		if (syncStatus === "saved" || syncStatus === "saving") return;

		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		performPush();
	}, [syncStatus, performPush]);

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

	// Cleanup timer on unmount
	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	return { syncStatus, markChanged, syncNow };
};
