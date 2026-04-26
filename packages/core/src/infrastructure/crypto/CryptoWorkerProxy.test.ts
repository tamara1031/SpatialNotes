import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CryptoWorkerProxy } from "./CryptoWorkerProxy.js";

// ---------------------------------------------------------------------------
// MockWorker — controllable stand-in for the real Web Worker.
// We capture the proxy's onmessage / onerror setters via Object.defineProperty
// so that `reply()` and `crash()` can drive the proxy from the outside.
// ---------------------------------------------------------------------------

interface MockWorkerInstance {
	onmessage: ((e: MessageEvent) => void) | null;
	onerror: ((e: ErrorEvent) => void) | null;
	postMessage: (data: unknown, transfer: Transferable[]) => void;
	terminate: () => void;
	reply: (response: unknown) => void;
	crash: (message: string) => void;
	lastMessage: unknown;
}

function createMockWorker(): MockWorkerInstance {
	const mock: MockWorkerInstance = {
		onmessage: null,
		onerror: null,
		postMessage: vi.fn(),
		terminate: vi.fn(),
		reply(response: unknown) {
			mock.onmessage?.({ data: response } as MessageEvent);
		},
		crash(message: string) {
			mock.onerror?.({ message } as ErrorEvent);
		},
		get lastMessage() {
			const calls = (mock.postMessage as ReturnType<typeof vi.fn>).mock.calls;
			return calls.at(-1)?.[0];
		},
	};
	return mock;
}

let mockWorker: MockWorkerInstance;
let proxy: CryptoWorkerProxy;

beforeEach(() => {
	mockWorker = createMockWorker();

	// Stub the global Worker constructor so CryptoWorkerProxy's `typeof Worker`
	// guard passes and we can intercept the onmessage / onerror assignments.
	vi.stubGlobal(
		"Worker",
		class {
			set onmessage(fn: ((e: MessageEvent) => void) | null) {
				mockWorker.onmessage = fn;
			}
			set onerror(fn: ((e: ErrorEvent) => void) | null) {
				mockWorker.onerror = fn;
			}
			postMessage(data: unknown, transfer: Transferable[]) {
				mockWorker.postMessage(data, transfer);
			}
			terminate() {
				mockWorker.terminate();
			}
		},
	);

	// CryptoWorkerProxy uses globalThis.crypto.randomUUID() — stub it with a
	// simple counter so each test emits predictable IDs.
	let uuidCounter = 0;
	vi.stubGlobal("crypto", {
		randomUUID: () => `uuid-${++uuidCounter}`,
	});

	vi.useFakeTimers();
	proxy = new CryptoWorkerProxy(
		new (globalThis as unknown as { Worker: new () => Worker }).Worker(),
	);
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function replyWith(payload: unknown) {
	const msg = mockWorker.lastMessage as { id: string; type: string };
	mockWorker.reply({ id: msg.id, type: `${msg.type}_REPLY`, payload });
}

function replyWithError(errorMessage: string) {
	const msg = mockWorker.lastMessage as { id: string; type: string };
	mockWorker.reply({
		id: msg.id,
		type: `${msg.type}_ERROR`,
		error: errorMessage,
	});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CryptoWorkerProxy", () => {
	describe("basic request/response", () => {
		it("resolves ping() when the worker replies", async () => {
			const p = proxy.ping();
			replyWith(undefined);
			await expect(p).resolves.toBeUndefined();
		});

		it("forwards postMessage with the correct type and a UUID id", async () => {
			proxy.ping();
			const msg = mockWorker.lastMessage as { type: string; id: string };
			expect(msg.type).toBe("PING");
			expect(msg.id).toMatch(/^uuid-\d+$/);
		});

		it("resolves decrypt() and unwraps result.data", async () => {
			const expected = new Uint8Array([1, 2, 3]);
			const p = proxy.decrypt(
				new Uint8Array(),
				new Uint8Array(),
				{} as CryptoKey,
			);
			replyWith({ data: expected });
			await expect(p).resolves.toBe(expected);
		});

		it("resolves wrapKey() and unwraps result.wrappedKey", async () => {
			const p = proxy.wrapKey({} as CryptoKey, {} as CryptoKey);
			replyWith({ wrappedKey: "wrapped-abc" });
			await expect(p).resolves.toBe("wrapped-abc");
		});
	});

	describe("error handling", () => {
		it("rejects when the worker replies with an error field", async () => {
			const p = proxy.ping();
			replyWithError("WASM panic");
			await expect(p).rejects.toThrow("WASM panic");
		});

		it("rejects when the worker replies with a *_ERROR type", async () => {
			const p = proxy.ping();
			const msg = mockWorker.lastMessage as { id: string };
			mockWorker.reply({ id: msg.id, type: "PING_ERROR", error: undefined });
			await expect(p).rejects.toThrow("Error in PING_ERROR");
		});

		it("ignores messages with unknown ids", async () => {
			// Should not throw or resolve anything
			mockWorker.reply({ id: "non-existent-id", type: "PONG", payload: "x" });
		});
	});

	describe("timeout", () => {
		it("rejects with a timeout error when no reply arrives within 30 s", async () => {
			const p = proxy.ping();
			const assertion = expect(p).rejects.toThrow(/timed out after 30000ms/);
			await vi.advanceTimersByTimeAsync(30_001);
			await assertion;
		});

		it("does not reject a request that already resolved when the timer fires", async () => {
			const p = proxy.ping();
			replyWith(undefined);
			await vi.advanceTimersByTimeAsync(30_001);
			await expect(p).resolves.toBeUndefined();
		});
	});

	describe("terminate()", () => {
		it("rejects all pending promises with 'terminated' reason", async () => {
			const p1 = proxy.ping();
			const p2 = proxy.encrypt(new Uint8Array(), {} as CryptoKey);
			proxy.terminate();
			await expect(p1).rejects.toThrow("CryptoWorker terminated");
			await expect(p2).rejects.toThrow("CryptoWorker terminated");
		});

		it("calls worker.terminate()", () => {
			proxy.terminate();
			expect(mockWorker.terminate).toHaveBeenCalledOnce();
		});

		it("silently resolves new calls after terminate (SSR no-op path)", async () => {
			proxy.terminate();
			// After terminate worker is undefined — send() returns resolved promise
			const p = proxy.ping();
			await expect(p).resolves.toBeUndefined();
		});
	});

	describe("onerror crash", () => {
		it("rejects all pending promises when the worker crashes", async () => {
			const p1 = proxy.ping();
			const p2 = proxy.encrypt(new Uint8Array(), {} as CryptoKey);
			mockWorker.crash("Segmentation fault");
			await expect(p1).rejects.toThrow(
				"CryptoWorker crashed: Segmentation fault",
			);
			await expect(p2).rejects.toThrow(
				"CryptoWorker crashed: Segmentation fault",
			);
		});

		it("does not leave any pending promises after a crash", async () => {
			const p = proxy.ping();
			const rejection = expect(p).rejects.toThrow();
			mockWorker.crash("boom");
			await rejection;
			// After crash, a subsequent reply for the same ID should be ignored
			// (pendingPromises map was cleared)
		});
	});

	describe("SSR no-op (no Worker global)", () => {
		it("resolves immediately when Worker is not available", async () => {
			vi.unstubAllGlobals();
			vi.stubGlobal("Worker", undefined);
			const ssrProxy = new CryptoWorkerProxy({} as Worker);
			await expect(ssrProxy.ping()).resolves.toBeUndefined();
		});
	});
});
