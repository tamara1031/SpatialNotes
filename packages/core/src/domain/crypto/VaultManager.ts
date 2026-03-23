import { VaultStatus } from "../vault/VaultStatus";
import type { VaultState } from "./types";

export class VaultManager {
	private isLocked: boolean = true;
	private dek: CryptoKey | null = null;
	private kek: CryptoKey | null = null;
	private authToken: string | null = null;
	private saltAuth: Uint8Array | null = null;
	private saltEncryption: Uint8Array | null = null;

	public getState(): VaultState {
		return {
			isLocked: this.isLocked,
			saltAuth: this.saltAuth || undefined,
			saltEncryption: this.saltEncryption || undefined,
		};
	}

	public getStatus(): VaultStatus {
		return this.isLocked ? VaultStatus.Locked() : VaultStatus.Unlocked();
	}

	public lock(): void {
		this.isLocked = true;
		this.dek = null;
		this.kek = null;
		this.authToken = null;
		this.saltAuth = null;
		this.saltEncryption = null;
	}

	public getAuthToken(): string {
		if (this.isLocked || !this.authToken) {
			throw new Error("Vault is locked");
		}
		return this.authToken;
	}

	public getDEK(): CryptoKey {
		if (this.isLocked || !this.dek) {
			throw new Error("Vault is locked");
		}
		return this.dek;
	}

	public getKEK(): CryptoKey {
		if (this.isLocked || !this.kek) {
			throw new Error("Vault is locked");
		}
		return this.kek;
	}

	/**
	 * Set the vault to unlocked state using pre-derived/unwrapped keys.
	 */
	public setUnlocked(
		authToken: string,
		dek: CryptoKey,
		kek: CryptoKey,
		saltAuth: Uint8Array,
		saltEncryption: Uint8Array,
	): void {
		this.authToken = authToken;
		this.dek = dek;
		this.kek = kek;
		this.saltAuth = saltAuth;
		this.saltEncryption = saltEncryption;
		this.isLocked = false;
	}
}
