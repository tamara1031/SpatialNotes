import type { VaultManager } from "../../domain/crypto/VaultManager";
import type { CryptoWorkerProxy } from "../../infrastructure/crypto/CryptoWorkerProxy";

export interface IVaultRegistryGateway {
	register(data: {
		email: string;
		salt_auth: string;
		encryption_salt: string;
		wrapped_dek: string;
		auth_token: string;
	}): Promise<{ token: string }>;
}

export interface RegisterVaultInput {
	email: string;
	password: string;
}

/**
 * UseCase to handle new user registration and vault setup.
 */
export class RegisterVaultUseCase {
	constructor(
		private readonly cryptoWorker: CryptoWorkerProxy,
		private readonly vaultManager: VaultManager,
		private readonly gateway: IVaultRegistryGateway,
	) {}

	async execute(input: RegisterVaultInput): Promise<{ token: string }> {
		// 1. Generate secure random salts
		const saltA = globalThis.crypto.getRandomValues(new Uint8Array(32));
		const saltE = globalThis.crypto.getRandomValues(new Uint8Array(32));

		// 2. Derive Auth Token and KEK
		const { authToken, kek } = await this.cryptoWorker.deriveVaultKeys(
			input.password,
			saltA,
			saltE,
		);

		// 3. Generate Master DEK (Data Encryption Key)
		const dek = await globalThis.crypto.subtle.generateKey(
			{ name: "AES-GCM", length: 256 },
			true,
			["encrypt", "decrypt"],
		);

		// 4. Wrap DEK with KEK
		const wrappedDEK = await this.cryptoWorker.wrapKey(dek, kek);

		// 5. Register with backend
		const { token } = await this.gateway.register({
			email: input.email,
			salt_auth: this.bytesToBase64(saltA),
			encryption_salt: this.bytesToBase64(saltE),
			wrapped_dek: wrappedDEK,
			auth_token: authToken,
		});

		// 6. Update VaultManager state
		this.vaultManager.setUnlocked(authToken, dek, kek, saltA, saltE);

		return { token };
	}

	private bytesToBase64(bytes: Uint8Array): string {
		return btoa(String.fromCharCode(...bytes));
	}
}
