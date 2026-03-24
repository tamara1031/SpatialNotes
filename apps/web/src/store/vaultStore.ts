import { atom, computed } from "nanostores";
import { api } from "../utils/api";
import { nodesMap, syncService } from "./noteStore";
import { showNotification } from "./notificationStore";

export * from "./auth/auth.actions";
export { authService } from "./auth/auth.service";
export { domainSyncService } from "./sync/SyncService";
export * from "./vault/vault.store";
// --- Modular Imports ---
export * from "./vault/vault.store.base";

import { cryptoService, cryptoWorker, identifyUser } from "./auth/auth.actions";
import { lockVaultInternal } from "./vault/vault.store";
// --- Facade Re-exports and Legacy Support ---
import {
	$appState,
	$currentUserEmail,
	$saltAuth,
	$saltEncryption,
	$sessionToken,
} from "./vault/vault.store.base";

export { cryptoService, cryptoWorker, identifyUser };

import { authService } from "./auth/auth.service";
export const $currentUser = atom<any>(null);
authService.subscribe((user) => $currentUser.set(user));

/**
 * Checks the vault status on initialization, looking for previous user sessions.
 * Triggers identifyUser if a previous user is found.
 */
export const checkVaultStatus = async () => {
	if (typeof window === "undefined" || !window.localStorage) return;

	const lastUser = localStorage.getItem("spatial_notes_last_user");
	if (lastUser) {
		await identifyUser(lastUser);
	} else {
		$appState.set("email");
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
	authService.logout();
	$sessionToken.set(null);
	$currentUserEmail.set(null);
	$saltAuth.set(null);
	$saltEncryption.set(null);
	$appState.set("email");
	syncService.reset();
};
