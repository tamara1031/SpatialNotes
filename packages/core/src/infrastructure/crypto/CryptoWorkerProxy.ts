import type { CryptoPayload } from "../../domain/crypto/types";

export class CryptoWorkerProxy {
	private worker?: Worker;
	private pendingPromises: Map<
		string,
		{ resolve: Function; reject: Function }
	> = new Map();

	constructor(worker: Worker) {
		if (typeof Worker !== "undefined") {
			this.worker = worker;
			this.worker.onmessage = this.handleMessage.bind(this);
			this.worker.onerror = (err) => {
				console.error("CryptoWorker Error:", err);
			};
		}
	}

	public async ping(): Promise<void> {
		return this.send("PING", {});
	}

	public async deriveVaultKeys(
		password: string,
		saltAuth: Uint8Array,
		saltEncryption: Uint8Array,
	): Promise<{ authToken: string; kek: CryptoKey }> {
		return this.send("DERIVE_VAULT_KEYS", {
			password,
			saltAuth,
			saltEncryption,
		});
	}

	public async wrapKey(key: CryptoKey, kek: CryptoKey): Promise<string> {
		const res = await this.send("WRAP_KEY", { key, kek });
		return res.wrappedKey;
	}

	public async unwrapKey(
		wrappedKey: string,
		kek: CryptoKey,
	): Promise<CryptoKey> {
		const res = await this.send("UNWRAP_KEY", { wrappedKey, kek });
		return res.key;
	}

	public async encrypt(
		data: Uint8Array,
		key: CryptoKey,
	): Promise<CryptoPayload> {
		return this.send("ENCRYPT", { data, key });
	}

	public async encryptXChaCha20(
		data: Uint8Array,
		key: Uint8Array,
	): Promise<{ data: Uint8Array; nonce: Uint8Array }> {
		return this.send("XCHACHA20_ENCRYPT", { data, key });
	}

	public async encryptCompressed(
		data: Uint8Array,
		key: CryptoKey,
	): Promise<CryptoPayload> {
		return this.send("ENCRYPT_COMPRESSED", { data, key });
	}

	public async decrypt(
		data: Uint8Array,
		iv: Uint8Array,
		key: CryptoKey,
	): Promise<Uint8Array> {
		const result = await this.send("DECRYPT", { data, iv, key });
		return result.data;
	}

	public async decryptXChaCha20(
		data: Uint8Array,
		nonce: Uint8Array,
		key: Uint8Array,
	): Promise<Uint8Array> {
		const result = await this.send("XCHACHA20_DECRYPT", { data, nonce, key });
		return result.data;
	}

	public async decryptDecompressed(
		data: Uint8Array,
		iv: Uint8Array,
		key: CryptoKey,
	): Promise<Uint8Array> {
		const result = await this.send("DECRYPT_DECOMPRESSED", { data, iv, key });
		return result.data;
	}

	public async processImage(
		data: Uint8Array,
		maxWidth: number = 2048,
		maxHeight: number = 2048,
	): Promise<Uint8Array> {
		const result = await this.send("PROCESS_IMAGE", {
			data,
			maxWidth,
			maxHeight,
		});
		return result.data;
	}

	private send(type: string, payload: any): Promise<any> {
		if (!this.worker) {
			return Promise.resolve(); // No-op in SSR
		}
		return new Promise((resolve, reject) => {
			const id = globalThis.crypto.randomUUID();
			this.pendingPromises.set(id, { resolve, reject });

			// Identify transferable objects
			const transfer: Transferable[] = [];
			if (payload.data instanceof Uint8Array) {
				// Only transfer if we are sure the caller doesn't need it anymore.
				// For simplicity in MVP, we might NOT transfer TO the worker unless performance is a bottleneck,
				// but we ALWAYS transfer FROM the worker.
			}

			this.worker?.postMessage({ id, type, payload }, transfer);
		});
	}

	private handleMessage(event: MessageEvent) {
		const { id, type, payload, error } = event.data;
		const promise = this.pendingPromises.get(id);
		if (!promise) return;

		this.pendingPromises.delete(id);

		if (error || type.endsWith("_ERROR")) {
			promise.reject(new Error(error || `Error in ${type}`));
		} else {
			promise.resolve(payload);
		}
	}

	public terminate() {
		this.worker?.terminate();
	}
}
