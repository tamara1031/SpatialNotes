import { AuthService } from "@spatial-notes/core";
import { atom, computed } from "nanostores";
import { api } from "../utils/api";
import { nodesMap, syncService } from "./noteStore";
import { showNotification } from "./notificationStore";

// --- Modular Imports ---
export * from "./vault/vault.store.base";
export * from "./vault/vault.store";
export * from "./auth/auth.actions";
export { domainSyncService } from "./sync/SyncService";

// --- Facade Re-exports and Legacy Support ---
import {
	$appState,
	$currentUserEmail,
	$sessionToken,
	$saltAuth,
	$saltEncryption
} from "./vault/vault.store.base";
import { vaultManager, updateVaultState, lockVaultInternal } from "./vault/vault.store";
import { identifyUser, cryptoService, cryptoWorker } from "./auth/auth.actions";
export { identifyUser, cryptoService, cryptoWorker };

const sessionStorage = {
	getItem: (key: string) => typeof window !== "undefined" ? localStorage.getItem(key) : null,
	setItem: (key: string, value: string) => { if (typeof window !== "undefined") localStorage.setItem(key, value); },
	removeItem: (key: string) => { if (typeof window !== "undefined") localStorage.removeItem(key); }
};
export const authService = new AuthService(sessionStorage);
export const $currentUser = atom<any>(null);
authService.subscribe(user => $currentUser.set(user));

export const checkVaultStatus = async () => {
	if (typeof window === "undefined" || !window.localStorage) return;

	const lastUser = localStorage.getItem("spatial_notes_last_user");
	if (lastUser) {
		await identifyUser(lastUser);
	}
};

export const syncInitialNodes = async () => {
	try {
		const nodes = await api.listNodes();
		syncService.ydoc.transact(() => {
			for (const node of nodes) {
				nodesMap.set(node.id, node);
			}
		}, "initial-sync");
	} catch (e) {
		console.error("Failed to sync initial nodes", e);
	}
};

export const $isAuthenticated = computed($sessionToken, (token) => !!token);

export const lockVault = () => {
	lockVaultInternal();
	$appState.set("locked");
	showNotification("Vault Locked", "info");
};

export const logout = () => {
	lockVaultInternal();
	$sessionToken.set(null);
	localStorage.removeItem("session_token");
	$currentUserEmail.set(null);
	$saltAuth.set(null);
	$saltEncryption.set(null);
	$appState.set("email");
	syncService.reset();
	// Navigation is handled by AuthGuard or manually in components if needed
};
