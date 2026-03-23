export interface CryptoPayload {
	data: Uint8Array;
	iv: Uint8Array;
}

export interface VaultState {
	isLocked: boolean;
	saltAuth?: Uint8Array;
	saltEncryption?: Uint8Array;
}

export interface AuthPayload {
	authToken: string;
	kek: CryptoKey;
}
