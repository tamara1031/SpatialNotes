import { type User, UserEntity } from "../../domain/user/User";

/**
 * Interface for session storage (can be implemented with localStorage or memory)
 */
export interface ISessionStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

export type AuthListener = (user: User | null) => void;

/**
 * Service to manage the current user session.
 */
export class AuthService {
	private currentUser: User | null = null;
	private listeners: AuthListener[] = [];

	constructor(private readonly sessionStorage: ISessionStorage) {
		this.loadSession();
	}

	public subscribe(listener: AuthListener): () => void {
		this.listeners.push(listener);
		listener(this.currentUser);
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener);
		};
	}

	private notify(): void {
		this.listeners.forEach((l) => l(this.currentUser));
	}

	public async login(username: string): Promise<User> {
		let user = this.findUserInStorage(username);
		if (!user) {
			user = UserEntity.create(username);
			this.saveUserToStorage(user);
		}

		this.currentUser = user;
		this.sessionStorage.setItem("spatial_notes_last_user", user.id);
		this.notify();
		return user;
	}

	public logout(): void {
		this.currentUser = null;
		this.sessionStorage.removeItem("spatial_notes_last_user");
		this.notify();
	}

	public getCurrentUser(): User | null {
		return this.currentUser;
	}

	private loadSession(): void {
		const lastUserId = this.sessionStorage.getItem("spatial_notes_last_user");
		if (lastUserId) {
			const usersJson =
				this.sessionStorage.getItem("spatial_notes_users") || "[]";
			const users = JSON.parse(usersJson);
			const user = users.find((u: any) => u.id === lastUserId);
			if (user) {
				this.currentUser = user;
			}
		}
	}

	private findUserInStorage(username: string): User | null {
		const usersJson =
			this.sessionStorage.getItem("spatial_notes_users") || "[]";
		const users = JSON.parse(usersJson);
		return users.find((u: any) => u.username === username) || null;
	}

	private saveUserToStorage(user: User): void {
		const usersJson =
			this.sessionStorage.getItem("spatial_notes_users") || "[]";
		const users = JSON.parse(usersJson);
		users.push(user);
		this.sessionStorage.setItem("spatial_notes_users", JSON.stringify(users));
	}
}
