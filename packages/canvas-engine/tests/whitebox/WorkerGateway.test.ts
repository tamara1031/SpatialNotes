import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkerGateway } from "../../src/bridge/WorkerGateway";

describe("WorkerGateway White-box Tests", () => {
	let bridge: WorkerGateway;
	let mockWorker: any;

	beforeEach(() => {
		mockWorker = {
			postMessage: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			terminate: vi.fn(),
		};
		// Mock global Worker as a proper class
		class MockWorkerClass {
			postMessage = mockWorker.postMessage;
			addEventListener = mockWorker.addEventListener;
			removeEventListener = mockWorker.removeEventListener;
			terminate = mockWorker.terminate;
			onmessage = null;
		}
		vi.stubGlobal("Worker", MockWorkerClass);
		bridge = new WorkerGateway();
	});

	it("should assign unique incrementing IDs to each request", async () => {
		const promise1 = bridge.init(100, 100);
		const promise2 = bridge.getStrokePath();

		expect(mockWorker.postMessage).toHaveBeenCalledTimes(2);

		const call1 = mockWorker.postMessage.mock.calls[0][0];
		const call2 = mockWorker.postMessage.mock.calls[1][0];

		expect(call1.id).toBe(0);
		expect(call2.id).toBe(1);
	});

	it("should resolve the correct promise when receiving a message with matching ID", async () => {
		// @ts-expect-error - private request
		const requestPromise = bridge.request("TEST_TYPE", { foo: "bar" });

		// Find the instance and its onmessage handler
		// @ts-expect-error - accessing private or mocked worker
		const handler = (bridge as any).worker.onmessage;

		// Simulate worker response
		handler({ data: { type: "DONE", id: 0, payload: "test_result" } });

		const result = await requestPromise;
		expect(result).toBe("test_result");
	});

	it("should ignore messages with unknown IDs", async () => {
		// @ts-expect-error - private request
		const requestPromise = bridge.request("TEST_TYPE");
		// @ts-expect-error
		const handler = (bridge as any).worker.onmessage;

		// Send wrong ID first
		handler({ data: { type: "DONE", id: 999, payload: "wrong" } });

		// Send correct ID
		handler({ data: { type: "DONE", id: 0, payload: "correct" } });

		const result = await requestPromise;
		expect(result).toBe("correct");
	});

	it("should handle ERROR messages by rejecting the promise", async () => {
		// @ts-expect-error - private request
		const requestPromise = bridge.request("FAIL_TYPE");
		// @ts-expect-error
		const handler = (bridge as any).worker.onmessage;

		handler({ data: { type: "ERROR", id: 0, error: "Simulated Failure" } });

		await expect(requestPromise).rejects.toThrow("Simulated Failure");
	});
});
