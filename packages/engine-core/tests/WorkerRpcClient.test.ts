import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkerRpcClient } from "../src/index";

// Concrete subclass that exposes request() for testing
class TestClient extends WorkerRpcClient {
	send<T = void>(type: string, payload?: unknown): Promise<T> {
		return this.request<T>(type, payload);
	}
}

// A mock Worker that can be controlled per test
class MockWorker {
	onmessage: ((e: MessageEvent) => void) | null = null;
	onerror: ((e: ErrorEvent | Event) => void) | null = null;
	messageQueue: { data: unknown }[] = [];

	postMessage(data: unknown) {
		this.messageQueue.push({ data });
	}

	terminate() {}

	// Drive a synthetic response
	reply(response: unknown) {
		this.onmessage?.({ data: response } as MessageEvent);
	}

	// Drive a synthetic onerror crash
	crash(message?: string) {
		const event =
			typeof ErrorEvent !== "undefined"
				? new ErrorEvent("error", { message: message ?? "boom" })
				: ({ message: message ?? "boom" } as unknown as ErrorEvent);
		this.onerror?.(event);
	}

	get lastMessage() {
		return this.messageQueue.at(-1)?.data;
	}
}

let mockWorker: MockWorker;

beforeEach(() => {
	mockWorker = new MockWorker();
	vi.stubGlobal(
		"Worker",
		class {
			onmessage: ((e: MessageEvent) => void) | null = null;
			onerror: ((e: ErrorEvent | Event) => void) | null = null;

			constructor() {
				// Wire the outer mockWorker to capture this instance's onmessage
				// and onerror setters so tests can drive both code paths.
				Object.defineProperty(mockWorker, "onmessage", {
					get: () => this.onmessage,
					set: (fn) => {
						this.onmessage = fn;
					},
					configurable: true,
				});
				Object.defineProperty(mockWorker, "onerror", {
					get: () => this.onerror,
					set: (fn) => {
						this.onerror = fn;
					},
					configurable: true,
				});
			}

			postMessage(data: unknown) {
				mockWorker.messageQueue.push({ data });
			}

			terminate() {}
		},
	);

	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe("WorkerRpcClient", () => {
	it("resolves when the worker replies with matching id", async () => {
		const client = new TestClient(new URL("mock://worker"));

		const promise = client.send<string>("PING");

		const msg = mockWorker.lastMessage as { type: string; id: number };
		mockWorker.reply({ type: "PONG", id: msg.id, payload: "pong" });

		await expect(promise).resolves.toBe("pong");
	});

	it("rejects when the worker replies with an error", async () => {
		const client = new TestClient(new URL("mock://worker"));

		const promise = client.send("FAIL");

		const msg = mockWorker.lastMessage as { type: string; id: number };
		mockWorker.reply({
			type: "ERROR",
			id: msg.id,
			error: "something went wrong",
		});

		await expect(promise).rejects.toThrow("something went wrong");
	});

	it("rejects with a timeout error when no reply arrives within 30 s", async () => {
		const client = new TestClient(new URL("mock://worker"));

		const promise = client.send("SLOW");
		// Attach the rejection handler BEFORE advancing timers to prevent an
		// unhandled-rejection event if the timer fires before the assertion.
		const assertion = expect(promise).rejects.toThrow(
			/timed out after 30000ms/,
		);

		await vi.advanceTimersByTimeAsync(30_001);
		await assertion;
	});

	it("does not reject a request that already resolved when timeout fires", async () => {
		const client = new TestClient(new URL("mock://worker"));

		const promise = client.send<number>("FAST");

		const msg = mockWorker.lastMessage as { type: string; id: number };
		// Reply immediately before the timer fires
		mockWorker.reply({ type: "DONE", id: msg.id, payload: 42 });

		// Advance time — the timer should be a no-op because it was cleared
		await vi.advanceTimersByTimeAsync(30_001);

		await expect(promise).resolves.toBe(42);
	});

	it("rejects all pending promises when terminate() is called", async () => {
		const client = new TestClient(new URL("mock://worker"));

		const p1 = client.send("A");
		const p2 = client.send("B");

		client.terminate();

		await expect(p1).rejects.toThrow("Worker terminated");
		await expect(p2).rejects.toThrow("Worker terminated");
	});

	it("rejects all pending promises when the worker crashes (onerror)", async () => {
		const client = new TestClient(new URL("mock://worker"));

		const p1 = client.send("A");
		const p2 = client.send("B");
		// Attach rejection handlers BEFORE driving the crash so a synchronous
		// rejection cannot escape as an unhandled-rejection event.
		const a1 = expect(p1).rejects.toThrow(/Worker crashed: boom/);
		const a2 = expect(p2).rejects.toThrow(/Worker crashed: boom/);

		mockWorker.crash("boom");

		await a1;
		await a2;
	});

	it("after a crash the pending map is empty so new sends queue cleanly", async () => {
		// We are NOT claiming the client is usable after a real worker
		// crash — in the browser, a dead worker cannot reply. We only
		// check the rpc bookkeeping: a fresh send must not collide with
		// the rejected entry's id and must end up registered as its own
		// pending entry. The mock worker continues to reply, which would
		// not happen against a real crashed worker, but that is what lets
		// us inspect the post-crash map rather than the post-crash
		// browser. Recovery is the application's job (recreate the
		// client or call terminate()).
		const client = new TestClient(new URL("mock://worker"));

		const stale = client.send("STALE");
		const a = expect(stale).rejects.toThrow(/Worker crashed/);
		mockWorker.crash("boom");
		await a;

		const fresh = client.send<number>("FRESH");
		const msg = mockWorker.lastMessage as { type: string; id: number };
		mockWorker.reply({ type: "DONE", id: msg.id, payload: 7 });
		await expect(fresh).resolves.toBe(7);
	});
});
