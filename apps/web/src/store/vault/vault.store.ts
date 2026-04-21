import { VaultManager } from "@spatial-notes/core";
import { atom, computed } from "nanostores";
import { authService } from "../auth/auth.service";
import { syncService } from "../noteStore";
import { showNotification } from "../notificationStore";
import {
	$appState,
	$currentUserEmail,
	$saltAuth,
	$saltEncryption,
	$sessionToken,
} from "./vault.store.base";

export const vaultManager = new VaultManager();

export const $vaultState = atom(vaultManager.getState());
export const $isLocked = computed($vaultState, (state) => state.isLocked);

export const updateVaultState = () => {
	$vaultState.set(vaultManager.getState());
};

export const lockVaultInternal = () => {
	vaultManager.lock();
	updateVaultState();
};

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
