/**
 * User domain entity.
 */
export interface User {
	id: string;
	username: string;
	email?: string;
	avatarUrl?: string;
	createdAt: number;
}

export class UserEntity implements User {
	constructor(
		public readonly id: string,
		public readonly username: string,
		public readonly createdAt: number = Date.now(),
		public readonly email?: string,
		public readonly avatarUrl?: string,
	) {}

	static create(username: string, email?: string): UserEntity {
		return new UserEntity(
			globalThis.crypto.randomUUID(),
			username,
			Date.now(),
			email,
		);
	}
}
