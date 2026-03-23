/**
 * VaultStatus Value Object
 * Represents the state of a vault in the domain layer.
 */
export type VaultStatusType = "LOCKED" | "UNLOCKED" | "UNLOCKING";

export class VaultStatus {
	private readonly value: VaultStatusType;

	private constructor(value: VaultStatusType) {
		this.value = value;
		Object.freeze(this);
	}

	public static Locked(): VaultStatus {
		return new VaultStatus("LOCKED");
	}

	public static Unlocked(): VaultStatus {
		return new VaultStatus("UNLOCKED");
	}

	public static Unlocking(): VaultStatus {
		return new VaultStatus("UNLOCKING");
	}

	public isLocked(): boolean {
		return this.value === "LOCKED";
	}

	public isUnlocked(): boolean {
		return this.value === "UNLOCKED";
	}

	public isUnlocking(): boolean {
		return this.value === "UNLOCKING";
	}

	public equals(other: VaultStatus): boolean {
		return this.value === other.value;
	}

	public toString(): string {
		return this.value;
	}
}
