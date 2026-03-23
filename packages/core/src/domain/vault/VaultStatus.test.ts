import { describe, expect, it } from "vitest";
import { VaultStatus } from "./VaultStatus";

describe("VaultStatus", () => {
	it("should create a LOCKED state", () => {
		const status = VaultStatus.Locked();
		expect(status.isLocked()).toBe(true);
		expect(status.isUnlocked()).toBe(false);
		expect(status.isUnlocking()).toBe(false);
	});

	it("should create an UNLOCKED state", () => {
		const status = VaultStatus.Unlocked();
		expect(status.isLocked()).toBe(false);
		expect(status.isUnlocked()).toBe(true);
		expect(status.isUnlocking()).toBe(false);
	});

	it("should create an UNLOCKING state", () => {
		const status = VaultStatus.Unlocking();
		expect(status.isLocked()).toBe(false);
		expect(status.isUnlocked()).toBe(false);
		expect(status.isUnlocking()).toBe(true);
	});

	it("should be immutable", () => {
		const status = VaultStatus.Locked();
		expect(() => {
			(status as any).value = "UNLOCKED";
		}).toThrow();
	});

	it("should equal another instance with the same value", () => {
		const status1 = VaultStatus.Locked();
		const status2 = VaultStatus.Locked();
		expect(status1.equals(status2)).toBe(true);
	});

	it("should not equal another instance with a different value", () => {
		const status1 = VaultStatus.Locked();
		const status2 = VaultStatus.Unlocked();
		expect(status1.equals(status2)).toBe(false);
	});
});
