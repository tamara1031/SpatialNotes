/**
 * Interface for cryptographic operations.
 * Handles the encryption and decryption of sensitive data.
 */
export interface ICryptoProvider {
	/**
	 * Encrypts the given data.
	 */
	encrypt(data: Uint8Array): Promise<Uint8Array>;

	/**
	 * Decrypts the given encrypted data.
	 */
	decrypt(data: Uint8Array): Promise<Uint8Array>;

	/**
	 * Derives a cryptographic key from a password and salt.
	 */
	deriveKey(password: string, salt: string): Promise<void>;
}
