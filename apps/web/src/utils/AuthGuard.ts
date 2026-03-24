/**
 * Client-side Auth Guard for Astro Pages
 * Centralizes redirect logic to prevent loops and ensure consistency.
 */
export const enforceAuthStatus = (mode: "public" | "private") => {
	if (typeof window === "undefined") return;

	const token = localStorage.getItem("session_token");
	const hasToken =
		token !== null && token !== "null" && token !== "undefined" && token !== "";
	const path = window.location.pathname;

	// Use trailingSlash: "always" compatible checks
	const isRoot = path === "/" || path === "";
	const isAuthPage = path.includes("/signin") || path.includes("/signup");
	const _isNotesPage = path.includes("/notes/");

	console.debug(`[AuthGuard] Mode: ${mode}, Token: ${hasToken}, Path: ${path}`);

	if (mode === "public") {
		// If on public pages and authenticated, we DON'T automatically redirect from root anymore
		// Only redirect if they are on an auth page but already have a token
		if (hasToken && isAuthPage) {
			console.log(
				"[AuthGuard] Authenticated user on auth page, redirecting to /notes/",
			);
			window.location.href = "/notes/";
		}
	} else if (mode === "private") {
		// If on private pages and NOT authenticated, go to signin
		// ONLY redirect if not already on an auth page or root
		if (!hasToken && !isAuthPage && !isRoot) {
			console.log(
				"[AuthGuard] Unauthenticated user on private page, redirecting to /signin/",
			);
			window.location.href = "/signin/";
		}
	}
};
