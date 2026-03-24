/**
 * @vitest-environment jsdom
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";
import { useEncryptedSync } from "../../src/hooks/useEncryptedSync";
import { $isLocked, cryptoService } from "../../src/store/vaultStore";
import { api } from "../../src/utils/api";

// Mock store and dependencies
vi.mock("../../src/store/noteStore", async () => {
	const Y = await import("yjs");
	const ydoc = new Y.Doc();
	return {
		ydoc,
		resetYDoc: vi.fn(),
		syncService: {
			ydoc,
			applyUpdate: vi.fn((update, _origin) => {
				Y.applyUpdate(ydoc, update);
			}),
		},
	};
});

vi.mock("../../src/store/vaultStore", async () => {
	const { atom } = await import("nanostores");
	return {
		$isLocked: atom(false),
		cryptoService: {
			encryptDelta: vi.fn(),
			decryptDelta: vi.fn(),
			serializePayload: vi.fn(),
			deserializePayload: vi.fn(),
		},
	};
});

vi.mock("../../src/utils/api", () => ({
	api: {
		pushUpdate: vi.fn(),
		getUpdates: vi.fn().mockResolvedValue([]),
	},
}));

describe("useEncryptedSync", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		$isLocked.set(false);
		(api.getUpdates as any).mockResolvedValue([]);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should fetch and apply updates on mount", async () => {
		const nodeId = "test-node";
		const mockRawUpdate = new Uint8Array([1, 2, 3]);
		const mockPayload = {
			data: new Uint8Array([4, 5, 6]),
			iv: new Uint8Array(12),
		};
		const ydocTmp = new Y.Doc();
		ydocTmp.getMap("test").set("key", "val");
		const mockDecrypted = Y.encodeStateAsUpdate(ydocTmp);

		(api.getUpdates as any).mockResolvedValue([mockRawUpdate]);
		(cryptoService.deserializePayload as any).mockReturnValue(mockPayload);
		(cryptoService.decryptDelta as any).mockResolvedValue(mockDecrypted);

		const { result } = renderHook(() => useEncryptedSync(nodeId, 5000));

		await waitFor(
			() => {
				expect(api.getUpdates).toHaveBeenCalled();
			},
			{ timeout: 2000 },
		);

		await waitFor(
			() => {
				expect(result.current.syncStatus).toBe("saved");
			},
			{ timeout: 2000 },
		);
	});

	it("should encrypt and push updates when markChanged is called (debounced)", async () => {
		const nodeId = "test-node";
		const { result } = renderHook(() => useEncryptedSync(nodeId, 5000));

		// Wait for initial fetch to finish (without timers active)
		await waitFor(() => expect(result.current.syncStatus).toBe("saved"), {
			timeout: 2000,
		});

		// NOW start fake timers
		vi.useFakeTimers();

		const mockUpdate = new Uint8Array([1, 2, 3]);
		const mockEncrypted = {
			data: new Uint8Array([4, 5, 6]),
			iv: new Uint8Array(12),
		};
		const mockSerialized = new Uint8Array([1, 2, 3, 4, 5, 6]);

		(cryptoService.encryptDelta as any).mockResolvedValue(mockEncrypted);
		(cryptoService.serializePayload as any).mockReturnValue(mockSerialized);
		(api.pushUpdate as any).mockResolvedValue(undefined);

		await act(async () => {
			result.current.markChanged(mockUpdate);
		});

		expect(result.current.syncStatus).toBe("unsaved");

		act(() => {
			vi.advanceTimersByTime(5000);
		});

		expect(result.current.syncStatus).toBe("saving");

		// Restore real timers so waitFor works for the async push
		vi.useRealTimers();

		await waitFor(
			() => {
				expect(api.pushUpdate).toHaveBeenCalled();
			},
			{ timeout: 2000 },
		);

		expect(result.current.syncStatus).toBe("saved");
	});
});
