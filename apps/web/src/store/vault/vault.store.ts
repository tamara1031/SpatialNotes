import { VaultManager } from "@spatial-notes/core";
import { atom, computed } from "nanostores";

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
