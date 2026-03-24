/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Worker for JSDOM - must be before any imports that use it
vi.stubGlobal(
	"Worker",
	class MockWorker {
		onmessage = () => {};
		postMessage = () => {};
		terminate = () => {};
	},
);

// Mock the Vite-style worker import
vi.mock("../../src/workers/CryptoWorker?worker", () => {
	return {
		default: class MockWorker {
			onmessage = () => {};
			postMessage = () => {};
			terminate = () => {};
		},
	};
});

import * as authActions from "../../src/store/auth/auth.actions";
import {
	$appState,
	$isAuthenticated,
	$sessionToken,
	checkVaultStatus,
	logout,
} from "../../src/store/vaultStore";

describe("vaultStore UI State", () => {
	beforeEach(() => {
		$sessionToken.set(null);
		// Mock window.location
		if (typeof window !== "undefined") {
			vi.stubGlobal("location", { href: "" });
		}
	});

	it("should derive isAuthenticated from sessionToken", () => {
		expect($isAuthenticated.get()).toBe(false);

		$sessionToken.set("mock-token");
		expect($isAuthenticated.get()).toBe(true);

		$sessionToken.set(null);
		expect($isAuthenticated.get()).toBe(false);
	});

	it("should clear session on logout", () => {
		$sessionToken.set("some-token");

		logout();

		expect($sessionToken.get()).toBe(null);
	});
});

describe("vaultStore checkVaultStatus", () => {
	beforeEach(() => {
		$appState.set("checking");
		vi.stubGlobal("localStorage", {
			getItem: vi.fn(),
			setItem: vi.fn(),
			removeItem: vi.fn(),
		});
		vi.spyOn(authActions, "identifyUser").mockResolvedValue(undefined);
	});

	it("should remain in checking state if no last user exists", async () => {
		(localStorage.getItem as any).mockReturnValue(null);
		await checkVaultStatus();
		expect($appState.get()).toBe("email");
	});

	it("should call identifyUser if last user exists", async () => {
		(localStorage.getItem as any).mockReturnValue("test@example.com");
		await checkVaultStatus();
		expect(authActions.identifyUser).toHaveBeenCalledWith("test@example.com");
	});

	it("should handle error gracefully when identifyUser throws", async () => {
		(localStorage.getItem as any).mockReturnValue("test@example.com");
		vi.spyOn(authActions, "identifyUser").mockRejectedValue(
			new Error("Network Error"),
		);
		await expect(checkVaultStatus()).rejects.toThrow("Network Error");
	});
});
