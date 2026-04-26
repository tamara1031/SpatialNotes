import type { CryptoPayload } from "../../domain/crypto/types.js";

const REQUEST_TIMEOUT_MS = 30_000;

interface PendingCall {
	resolve: (value: unknown) => void;
	reject: (reason?: unknown) => void;
	timer: ReturnType<typeof setTimeout>;
}

export class CryptoWorkerProxy {
	private worker?: Worker;
	private pendingPromises: Map<string, PendingCall> = new Map();

	constructor(worker: Worker) {
		if (typeof Worker !== "undefined") {
			this.worker = worker;
			this.worker.onmessage = this.handleMessage.bind(this);
			// Reject all pending callers if the worker crashes so they don't hang.
			this.worker.onerror = (err) => {
				console.error("CryptoWorker Error:", err);
				this.rejectAllPending(new Error(`CryptoWorker crashed: ${err.message}`));
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
		const res = await this.send<{ wrappedKey: string }>("WRAP_KEY", {
			key,
			kek,
		});
		return res.wrappedKey;
	}

	public async unwrapKey(
		wrappedKey: string,
		kek: CryptoKey,
	): Promise<CryptoKey> {
		const res = await this.send<{ key: CryptoKey }>("UNWRAP_KEY", {
			wrappedKey,
			kek,
		});
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
		const result = await this.send<{ data: Uint8Array }>("DECRYPT", {
			data,
			iv,
			key,
		});
		return result.data;
	}

	public async decryptXChaCha20(
		data: Uint8Array,
		nonce: Uint8Array,
		key: Uint8Array,
	): Promise<Uint8Array> {
		const result = await this.send<{ data: Uint8Array }>("XCHACHA20_DECRYPT", {
			data,
			nonce,
			key,
		});
		return result.data;
	}

	public async decryptDecompressed(
		data: Uint8Array,
		iv: Uint8Array,
		key: CryptoKey,
	): Promise<Uint8Array> {
		const result = await this.send<{ data: Uint8Array }>(
			"DECRYPT_DECOMPRESSED",
			{ data, iv, key },
		);
		return result.data;
	}

	public async processImage(
		data: Uint8Array,
		maxWidth: number = 2048,
		maxHeight: number = 2048,
	): Promise<Uint8Array> {
		const result = await this.send<{ data: Uint8Array }>("PROCESS_IMAGE", {
			data,
			maxWidth,
			maxHeight,
		});
		return result.data;
	}

	private send<T = unknown>(type: string, payload: unknown): Promise<T> {
		if (!this.worker) {
			return Promise.resolve(undefined as unknown as T); // No-op in SSR
		}
		return new Promise<T>((resolve, reject) => {
			const id = globalThis.crypto.randomUUID();
			const timer = setTimeout(() => {
				this.pendingPromises.delete(id);
				reject(
					new Error(
						`CryptoWorker request "${type}" timed out after ${REQUEST_TIMEOUT_MS}ms`,
					),
				);
			}, REQUEST_TIMEOUT_MS);
			this.pendingPromises.set(id, {
				resolve: (v) => resolve(v as T),
				reject,
				timer,
			});
			this.worker?.postMessage({ id, type, payload }, []);
		});
	}

	private handleMessage(event: MessageEvent) {
		const { id, type, payload, error } = event.data as {
			id: string;
			type: string;
			payload: unknown;
			error?: string;
		};
		const entry = this.pendingPromises.get(id);
		if (!entry) return;
		clearTimeout(entry.timer);
		this.pendingPromises.delete(id);
		if (error || type.endsWith("_ERROR")) {
			entry.reject(new Error(error || `Error in ${type}`));
		} else {
			entry.resolve(payload);
		}
	}

	public terminate() {
		this.worker?.terminate();
		this.worker = undefined;
		this.rejectAllPending(new Error("CryptoWorker terminated"));
	}

	private rejectAllPending(reason: Error): void {
		for (const entry of this.pendingPromises.values()) {
			clearTimeout(entry.timer);
			entry.reject(reason);
		}
		this.pendingPromises.clear();
	}
}
