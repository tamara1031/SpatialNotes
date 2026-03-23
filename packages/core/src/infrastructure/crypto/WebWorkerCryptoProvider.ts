import type { ICryptoProvider } from "../../domain/crypto/ICryptoProvider";
import type { CryptoWorkerProxy } from "./CryptoWorkerProxy";

/**
 * Implementation of ICryptoProvider that offloads operations to a Web Worker.
 */
export class WebWorkerCryptoProvider implements ICryptoProvider {
	private vaultKey: CryptoKey | null = null;

	constructor(private readonly workerProxy: CryptoWorkerProxy) {}

	/**
	 * Encrypts data and combines it with its IV.
	 * Output: IV (12 bytes) + Ciphertext
	 */
	public async encrypt(data: Uint8Array): Promise<Uint8Array> {
		if (!this.vaultKey) {
			throw new Error("Key not derived. Call deriveKey first.");
		}

		const result = await this.workerProxy.encrypt(data, this.vaultKey);
		const combined = new Uint8Array(result.iv.length + result.data.length);
		combined.set(result.iv);
		combined.set(result.data, result.iv.length);
		return combined;
	}

	/**
	 * Decrypts data that was combined with its IV.
	 * Input: IV (12 bytes) + Ciphertext
	 */
	public async decrypt(data: Uint8Array): Promise<Uint8Array> {
		if (!this.vaultKey) {
			throw new Error("Key not derived. Call deriveKey first.");
		}

		if (data.length < 12) {
			throw new Error("Invalid encrypted data: too short.");
		}

		const iv = data.slice(0, 12);
		const ciphertext = data.slice(12);

		return await this.workerProxy.decrypt(ciphertext, iv, this.vaultKey);
	}

	/**
	 * Derives a key from a password and salt.
	 */
	public async deriveKey(password: string, salt: string): Promise<void> {
		const encoder = new TextEncoder();
		const saltUint8 = encoder.encode(salt);
		const saltEncryption = encoder.encode(`${salt}_enc`); // Basic derivation for fallback

		const result = await this.workerProxy.deriveVaultKeys(
			password,
			saltUint8,
			saltEncryption,
		);
		this.vaultKey = result.kek;
	}
}
