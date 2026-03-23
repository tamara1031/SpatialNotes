import {
    CryptoService,
    CryptoWorkerProxy,
    RegisterVaultUseCase,
    UnlockVaultUseCase,
} from "@spatial-notes/core";
import { VaultGateway } from "../../infrastructure/vault/VaultGateway";
import CryptoWorker from "../../workers/CryptoWorker?worker";
import { $appState, $currentUserEmail, $saltAuth, $saltEncryption, $sessionToken } from "../vault/vault.store.base";
import { updateVaultState, vaultManager } from "../vault/vault.store";

// Infrastructure
const gateway = new VaultGateway();
export const cryptoWorker = typeof window !== "undefined"
    ? new CryptoWorkerProxy(new CryptoWorker())
    : (null as any);

export const cryptoService = new CryptoService(vaultManager, cryptoWorker);

const registerUseCase = new RegisterVaultUseCase(cryptoWorker, vaultManager, gateway);
const unlockUseCase = new UnlockVaultUseCase(cryptoWorker, vaultManager, gateway);

export const identifyUser = async (email: string) => {
    const data = await gateway.getSalt(email);
    $currentUserEmail.set(email);

    if (data.exists && data.salt_auth && data.encryption_salt) {
        $saltAuth.set(base64ToBytes(data.salt_auth));
        $saltEncryption.set(base64ToBytes(data.encryption_salt));
        $appState.set("locked");
    } else {
        $appState.set("setup");
    }
};

export const signup = async (email: string, password: string) => {
    const { token } = await registerUseCase.execute({ email, password });
    finalizeLogin(token);
};

export const signin = async (password: string) => {
    const email = $currentUserEmail.get();
    const sA = $saltAuth.get();
    const sE = $saltEncryption.get();

    if (!email || !sA || !sE) throw new Error("Missing auth context");

    const { token } = await unlockUseCase.execute({
        email,
        password,
        saltAuth: sA,
        saltEncryption: sE,
    });
    finalizeLogin(token);
};

const finalizeLogin = (token: string) => {
    $sessionToken.set(token);
    localStorage.setItem("session_token", token);
    updateVaultState();
    $appState.set("unlocked");
};

// Helpers
const base64ToBytes = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};
