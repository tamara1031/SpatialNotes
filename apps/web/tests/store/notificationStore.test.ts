import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	$notifications,
	removeNotification,
	showNotification,
	updateNotificationProgress,
} from "../../src/store/notificationStore";

describe("notificationStore", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		$notifications.set([]);
	});

	afterEach(() => {
		vi.useRealTimers();
		$notifications.set([]);
	});

	it("auto-removes non-loading notifications after duration", () => {
		const id = showNotification("Saved", "success", { duration: 1000 });

		expect($notifications.get()).toHaveLength(1);
		vi.advanceTimersByTime(1000);

		expect($notifications.get().find((n) => n.id === id)).toBeUndefined();
	});

	it("keeps loading notifications until explicitly removed", () => {
		const id = showNotification("Syncing", "loading", { duration: 100 });

		vi.advanceTimersByTime(10_000);

		expect($notifications.get().find((n) => n.id === id)).toBeDefined();

		removeNotification(id);
		expect($notifications.get()).toHaveLength(0);
	});

	it("updates progress immutably by id", () => {
		const id = showNotification("Uploading", "loading", { duration: 0 });
		const original = $notifications.get();

		updateNotificationProgress(id, 42);

		const current = $notifications.get();
		expect(current[0]?.progress).toBe(42);
		expect(current).not.toBe(original);
	});
});
