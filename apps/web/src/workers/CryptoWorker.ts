/**
 * CryptoWorker - Web Worker for offloading cryptographic operations.
 */
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";

// We don't use 'export' because it's a Worker script

self.onmessage = (event: MessageEvent) => {
	const { id, type, payload } = event.data;

	if (type === "PING") {
		self.postMessage({ id, type: "PONG" });
		return;
	}

	if (type === "DERIVE_VAULT_KEYS") {
		const { password, saltAuth, saltEncryption } = payload;
		deriveVaultKeys(id, password, saltAuth, saltEncryption);
		return;
	}

	if (type === "WRAP_KEY") {
		const { key, kek } = payload;
		wrapKey(id, key, kek);
		return;
	}

	if (type === "UNWRAP_KEY") {
		const { wrappedKey, kek } = payload;
		unwrapKey(id, wrappedKey, kek);
		return;
	}

	if (type === "XCHACHA20_ENCRYPT") {
		const { data, key } = payload;
		encryptXChaCha20(id, data, key);
		return;
	}

	if (type === "XCHACHA20_DECRYPT") {
		const { data, nonce, key } = payload;
		decryptXChaCha20(id, data, nonce, key);
		return;
	}

	self.postMessage({ id, error: `Unknown message type: ${type}` });
};

async function encryptCompressed(id: string, data: Uint8Array, key: CryptoKey) {
	try {
		// 1. Compress
		const compressedStream = new Response(data as any).body?.pipeThrough(
			new CompressionStream("deflate"),
		);
		const compressedData = new Uint8Array(
			await new Response(compressedStream).arrayBuffer(),
		);

		// 2. Encrypt
		const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
		const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
			{ name: "AES-GCM", iv: iv as any },
			key,
			compressedData as any,
		);

		const encryptedArray = new Uint8Array(encryptedBuffer);

		self.postMessage(
			{
				id,
				type: "ENCRYPT_SUCCESS",
				payload: { data: encryptedArray, iv },
			},
			[encryptedArray.buffer, iv.buffer] as any,
		);
	} catch (error: any) {
		self.postMessage({ id, type: "ENCRYPT_ERROR", error: error.message });
	}
}

async function decryptDecompressed(
	id: string,
	data: Uint8Array,
	iv: Uint8Array,
	key: CryptoKey,
) {
	try {
		// 1. Decrypt
		const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: iv as any },
			key,
			data as any,
		);

		const decryptedArray = new Uint8Array(decryptedBuffer);

		// 2. Decompress
		const decompressedStream = new Response(
			decryptedArray as any,
		).body?.pipeThrough(new DecompressionStream("deflate"));
		const decompressedData = new Uint8Array(
			await new Response(decompressedStream).arrayBuffer(),
		);

		self.postMessage(
			{
				id,
				type: "DECRYPT_SUCCESS",
				payload: { data: decompressedData },
			},
			[decompressedData.buffer] as any,
		);
	} catch (error: any) {
		self.postMessage({ id, type: "DECRYPT_ERROR", error: error.message });
	}
}

async function encrypt(id: string, data: any, key: CryptoKey) {
	try {
		const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
		const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
			{ name: "AES-GCM", iv: iv as any },
			key,
			data as any,
		);

		const encryptedArray = new Uint8Array(encryptedBuffer);
		self.postMessage(
			{
				id,
				type: "ENCRYPT_SUCCESS",
				payload: { data: encryptedArray, iv },
			},
			[encryptedArray.buffer, iv.buffer] as any,
		);
	} catch (error: any) {
		self.postMessage({ id, type: "ENCRYPT_ERROR", error: error.message });
	}
}

async function decrypt(id: string, data: any, iv: any, key: CryptoKey) {
	try {
		const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: iv as any },
			key,
			data as any,
		);

		const decryptedArray = new Uint8Array(decryptedBuffer);
		self.postMessage(
			{
				id,
				type: "DECRYPT_SUCCESS",
				payload: { data: decryptedArray },
			},
			[decryptedArray.buffer] as any,
		);
	} catch (error: any) {
		self.postMessage({ id, type: "DECRYPT_ERROR", error: error.message });
	}
}

async function deriveVaultKeys(
	id: string,
	password: string,
	saltAuth: Uint8Array,
	saltEncryption: Uint8Array,
) {
	try {
		const encoder = new TextEncoder();
		const passwordBuffer = encoder.encode(password);

		const baseKey = await globalThis.crypto.subtle.importKey(
			"raw",
			passwordBuffer,
			"PBKDF2",
			false,
			["deriveBits"],
		);

		const authBits = await globalThis.crypto.subtle.deriveBits(
			{
				name: "PBKDF2",
				salt: saltAuth as any,
				iterations: 100000,
				hash: "SHA-256",
			},
			baseKey,
			256,
		);

		const authHashBuffer = await globalThis.crypto.subtle.digest(
			"SHA-256",
			authBits as any,
		);
		const authToken = Array.from(new Uint8Array(authHashBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		// 2. Derive KEK (Key Encryption Key)
		const kekBits = await globalThis.crypto.subtle.deriveBits(
			{
				name: "PBKDF2",
				salt: saltEncryption as any,
				iterations: 100000,
				hash: "SHA-256",
			},
			baseKey,
			256,
		);

		const kek = await globalThis.crypto.subtle.importKey(
			"raw",
			kekBits as any,
			{ name: "AES-GCM" },
			false,
			["encrypt", "decrypt"],
		);

		self.postMessage({
			id,
			type: "DERIVE_VAULT_KEYS_SUCCESS",
			payload: { authToken, kek },
		});
	} catch (error: any) {
		self.postMessage({
			id,
			type: "DERIVE_VAULT_KEYS_ERROR",
			error: error.message,
		});
	}
}

async function wrapKey(id: string, key: CryptoKey, kek: CryptoKey) {
	try {
		// Export the raw DEK to encrypt it
		const rawKey = await globalThis.crypto.subtle.exportKey("raw", key);
		const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));

		const wrappedBuffer = await globalThis.crypto.subtle.encrypt(
			{ name: "AES-GCM", iv: iv as any },
			kek,
			rawKey as any,
		);

		const wrappedArray = new Uint8Array(wrappedBuffer);
		// Combine IV + Ciphertext for storage
		const combined = new Uint8Array(iv.length + wrappedArray.length);
		combined.set(iv as any);
		combined.set(wrappedArray as any, iv.length);

		const combinedBase64 = btoa(String.fromCharCode(...combined));

		self.postMessage({
			id,
			type: "WRAP_KEY_SUCCESS",
			payload: { wrappedKey: combinedBase64 },
		});
	} catch (error: any) {
		self.postMessage({ id, type: "WRAP_KEY_ERROR", error: error.message });
	}
}

async function unwrapKey(id: string, wrappedKeyBase64: string, kek: CryptoKey) {
	try {
		const combined = new Uint8Array(
			atob(wrappedKeyBase64)
				.split("")
				.map((c) => c.charCodeAt(0)),
		);

		const iv = combined.slice(0, 12);
		const wrappedArray = combined.slice(12);

		const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: iv as any },
			kek,
			wrappedArray as any,
		);

		const key = await globalThis.crypto.subtle.importKey(
			"raw",
			decryptedBuffer,
			{ name: "AES-GCM" },
			true,
			["encrypt", "decrypt"],
		);

		self.postMessage({
			id,
			type: "UNWRAP_KEY_SUCCESS",
			payload: { key },
		});
	} catch (error: any) {
		self.postMessage({ id, type: "UNWRAP_KEY_ERROR", error: error.message });
	}
}

async function encryptXChaCha20(id: string, data: Uint8Array, key: Uint8Array) {
	try {
		const nonce = globalThis.crypto.getRandomValues(new Uint8Array(24));
		const chacha = xchacha20poly1305(key, nonce);
		const ciphertext = chacha.encrypt(data);

		self.postMessage(
			{
				id,
				type: "ENCRYPT_SUCCESS",
				payload: { data: ciphertext, nonce },
			},
			[ciphertext.buffer, nonce.buffer] as any,
		);
	} catch (error: any) {
		self.postMessage({ id, type: "ENCRYPT_ERROR", error: error.message });
	}
}

async function decryptXChaCha20(
	id: string,
	data: Uint8Array,
	nonce: Uint8Array,
	key: Uint8Array,
) {
	try {
		const chacha = xchacha20poly1305(key, nonce);
		const decrypted = chacha.decrypt(data);

		self.postMessage(
			{
				id,
				type: "DECRYPT_SUCCESS",
				payload: { data: decrypted },
			},
			[decrypted.buffer] as any,
		);
	} catch (error: any) {
		self.postMessage({ id, type: "DECRYPT_ERROR", error: error.message });
	}
}
