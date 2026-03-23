import type { CryptoWorkerProxy } from "../../infrastructure/crypto/CryptoWorkerProxy";
import type { CryptoPayload } from "./types";
import type { VaultManager } from "./VaultManager";

export class CryptoService {
	constructor(
		private vaultManager: VaultManager,
		private cryptoWorker: CryptoWorkerProxy,
	) {}

	/**
	 * Unlock the vault and the worker.
	 */
	public async unlock(
		password: string,
		saltAuth: Uint8Array,
		saltEncryption: Uint8Array,
	): Promise<void> {
		// 1. Derive keys in the worker (for heavy lifting)
		const { authToken, kek } = await this.cryptoWorker.deriveVaultKeys(
			password,
			saltAuth,
			saltEncryption,
		);

		// 2. Derive a DEK (Data Encryption Key) - for now we use the KEK as a placeholder or we derive a real one
		// In a full implementation, we might unwrap a stored DEK using the KEK.
		// For this refactor, we'll treat KEK as the primary vault key for DEK operations if DEK is not yet stored.
		const dek = kek;

		// 3. Synchronize the VaultManager state with pre-derived keys.
		this.vaultManager.setUnlocked(
			authToken,
			dek,
			kek,
			saltAuth,
			saltEncryption,
		);
	}

	public async encrypt(data: Uint8Array): Promise<CryptoPayload> {
		this.ensureUnlocked();
		const vaultKey = this.vaultManager.getDEK();

		return this.cryptoWorker.encrypt(data, vaultKey);
	}

	public async decrypt(payload: CryptoPayload): Promise<Uint8Array> {
		this.ensureUnlocked();
		const vaultKey = this.vaultManager.getDEK();

		return this.cryptoWorker.decrypt(payload.data, payload.iv, vaultKey);
	}

	/**
	 * Alias for encrypt, used for Yjs delta updates.
	 * Now includes compression (ADR-040).
	 */
	public async encryptDelta(data: Uint8Array): Promise<CryptoPayload> {
		this.ensureUnlocked();
		const vaultKey = this.vaultManager.getDEK();

		return this.cryptoWorker.encryptCompressed(data, vaultKey);
	}

	/**
	 * Alias for decrypt, used for Yjs delta updates.
	 * Now includes decompression (ADR-040).
	 */
	public async decryptDelta(payload: CryptoPayload): Promise<Uint8Array> {
		this.ensureUnlocked();
		const vaultKey = this.vaultManager.getDEK();

		return this.cryptoWorker.decryptDecompressed(
			payload.data,
			payload.iv,
			vaultKey,
		);
	}

	/**
	 * Process (resize + webp) and then encrypt an image.
	 */
	public async processAndEncryptImage(
		data: Uint8Array,
		maxWidth: number = 2048,
		maxHeight: number = 2048,
	): Promise<CryptoPayload> {
		this.ensureUnlocked();
		const vaultKey = this.vaultManager.getDEK();

		// 1. Process image (in worker)
		const processedData = await this.cryptoWorker.processImage(
			data,
			maxWidth,
			maxHeight,
		);

		// 2. Encrypt processed data
		return this.cryptoWorker.encrypt(processedData, vaultKey);
	}

	/**
	 * Serialize CryptoPayload into a single Uint8Array (IV + DATA)
	 */
	public serializePayload(payload: CryptoPayload): Uint8Array {
		const out = new Uint8Array(payload.iv.length + payload.data.length);
		out.set(payload.iv, 0);
		out.set(payload.data, payload.iv.length);
		return out;
	}

	/**
	 * Deserialize a raw Uint8Array into a CryptoPayload
	 */
	public deserializePayload(raw: Uint8Array): CryptoPayload {
		if (raw.length < 12) {
			throw new Error("Invalid payload: too short");
		}
		const iv = raw.slice(0, 12);
		const data = raw.slice(12);
		return { iv, data };
	}

	private ensureUnlocked() {
		if (this.vaultManager.getState().isLocked) {
			throw new Error("Vault is locked");
		}
	}
}
