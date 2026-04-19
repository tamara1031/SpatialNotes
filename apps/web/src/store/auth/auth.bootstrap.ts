import { $appState } from "../vault/vault.store.base";
import * as authActions from "./auth.actions";

/**
 * On startup, restore the "identified" state if a previous user is remembered
 * in localStorage. If not, transition to the email-entry screen.
 *
 * Kept in its own module so tests can spy on `authActions.identifyUser`
 * through the namespace import.
 */
export const checkVaultStatus = async () => {
	if (typeof window === "undefined" || !window.localStorage) return;

	const lastUser = localStorage.getItem("spatial_notes_last_user");
	if (lastUser) {
		await authActions.identifyUser(lastUser);
	} else {
		$appState.set("email");
	}
};
