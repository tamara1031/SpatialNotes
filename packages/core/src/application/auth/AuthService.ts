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
 * Service to manage the current user session and authentication state.
 * This is the single source of truth for the logged-in user.
 */
export class AuthService {
	private currentUser: User | null = null;
	private sessionToken: string | null = null;
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

	/**
	 * Sets the current session from a successful login/signup.
	 */
	public setSession(user: User, token: string): void {
		this.currentUser = user;
		this.sessionToken = token;
		this.sessionStorage.setItem("session_token", token);
		this.sessionStorage.setItem("spatial_notes_last_user", user.email || user.id);

		// Store user data for persistence
		const usersJson = this.sessionStorage.getItem("spatial_notes_users") || "[]";
		const users = JSON.parse(usersJson);
		const existingIndex = users.findIndex((u: any) => u.email === user.email);
		if (existingIndex >= 0) {
			users[existingIndex] = user;
		} else {
			users.push(user);
		}
		this.sessionStorage.setItem("spatial_notes_users", JSON.stringify(users));

		this.notify();
	}

	public logout(): void {
		this.currentUser = null;
		this.sessionToken = null;
		this.sessionStorage.removeItem("session_token");
		this.sessionStorage.removeItem("spatial_notes_last_user");
		this.notify();
	}

	public getCurrentUser(): User | null {
		return this.currentUser;
	}

	public getSessionToken(): string | null {
		return this.sessionToken;
	}

	private loadSession(): void {
		this.sessionToken = this.sessionStorage.getItem("session_token");
		const lastUserEmail = this.sessionStorage.getItem("spatial_notes_last_user");

		if (this.sessionToken && lastUserEmail) {
			const usersJson = this.sessionStorage.getItem("spatial_notes_users") || "[]";
			const users = JSON.parse(usersJson);
			const user = users.find((u: any) => u.email === lastUserEmail || u.id === lastUserEmail);
			if (user) {
				this.currentUser = user;
			}
		}
	}
}
