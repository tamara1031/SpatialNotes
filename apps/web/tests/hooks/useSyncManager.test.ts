/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSyncManager } from "../../src/hooks/useSyncManager";

describe("useSyncManager", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should start in saved state", () => {
		const mockPush = vi.fn().mockResolvedValue(true);
		const { result } = renderHook(() => useSyncManager(mockPush, 5000));

		expect(result.current.syncStatus).toBe("saved");
	});

	it("should transition to unsaved and then debounced saving", async () => {
		const mockPush = vi.fn().mockResolvedValue(true);
		const { result } = renderHook(() => useSyncManager(mockPush, 5000));

		// Trigger change
		act(() => {
			result.current.markChanged();
		});

		expect(result.current.syncStatus).toBe("unsaved");
		expect(mockPush).not.toHaveBeenCalled();

		// Advance timers by less than debounce
		act(() => {
			vi.advanceTimersByTime(2000);
		});
		expect(result.current.syncStatus).toBe("unsaved");
		expect(mockPush).not.toHaveBeenCalled();

		// Advance past debounce
		act(() => {
			vi.advanceTimersByTime(3000);
		});

		// It should be saving now
		expect(result.current.syncStatus).toBe("saving");
		expect(mockPush).toHaveBeenCalledTimes(1);

		// Resolve push
		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(result.current.syncStatus).toBe("saved");
	});

	it("should trigger immediate save when syncNow is called", async () => {
		const mockPush = vi.fn().mockResolvedValue(true);
		const { result } = renderHook(() => useSyncManager(mockPush, 5000));

		act(() => {
			result.current.markChanged();
		});

		expect(result.current.syncStatus).toBe("unsaved");

		act(() => {
			result.current.syncNow();
		});

		expect(result.current.syncStatus).toBe("saving");
		expect(mockPush).toHaveBeenCalledTimes(1);

		await act(async () => {
			await vi.runAllTimersAsync();
		});

		expect(result.current.syncStatus).toBe("saved");
	});
});
