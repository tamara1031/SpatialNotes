import type { VaultManager } from "../../domain/crypto/VaultManager";
import type { CryptoWorkerProxy } from "../../infrastructure/crypto/CryptoWorkerProxy";

export interface IVaultAuthGateway {
	login(data: {
		email: string;
		auth_token: string;
	}): Promise<{ token: string; wrapped_dek: string }>;
}

export interface UnlockVaultInput {
	email: string;
	password: string;
	saltAuth: Uint8Array;
	saltEncryption: Uint8Array;
}

/**
 * UseCase to handle unlocking an existing vault.
 */
export class UnlockVaultUseCase {
	constructor(
		private readonly cryptoWorker: CryptoWorkerProxy,
		private readonly vaultManager: VaultManager,
		private readonly gateway: IVaultAuthGateway,
	) {}

	async execute(input: UnlockVaultInput): Promise<{ token: string }> {
		// 1. Derive Auth Token and KEK
		const { authToken, kek } = await this.cryptoWorker.deriveVaultKeys(
			input.password,
			input.saltAuth,
			input.saltEncryption,
		);

		// 2. Login to get session token and Wrapped DEK
		const { token, wrapped_dek } = await this.gateway.login({
			email: input.email,
			auth_token: authToken,
		});

		// 3. Unwrap DEK using KEK
		const dek = await this.cryptoWorker.unwrapKey(wrapped_dek, kek);

		// 4. Update VaultManager state
		this.vaultManager.setUnlocked(
			authToken,
			dek,
			kek,
			input.saltAuth,
			input.saltEncryption,
		);

		return { token };
	}
}
