import { atom } from "nanostores";

export type AppState = "checking" | "email" | "setup" | "locked" | "unlocked";

export const $appState = atom<AppState>("checking");
export const $currentUserEmail = atom<string | null>(null);
export const $saltAuth = atom<Uint8Array | null>(null);
export const $saltEncryption = atom<Uint8Array | null>(null);
export const $sessionToken = atom<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("session_token") : null,
);
