import type { User } from "@spatial-notes/core";
import { atom, computed } from "nanostores";
import { $sessionToken } from "../vault/vault.store.base";
import { authService } from "./auth.service";

export const $currentUser = atom<User | null>(null);
authService.subscribe((user) => $currentUser.set(user));

export const $isAuthenticated = computed($sessionToken, (token) => !!token);
