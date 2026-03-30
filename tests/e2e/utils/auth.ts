import { expect, type Page } from "@playwright/test";

/**
 * Performs a real registration or login flow.
 */
export async function authenticate(
	page: Page,
	email: string = `test-${Math.random().toString(36).substr(2, 9)}@example.com`,
) {
	console.log(`Authenticating with email: ${email}`);

	// Always go to signup for e2e tests since we generate unique emails
	await page.goto("/signup/");

	// Wait for network idle
	await page.waitForLoadState("networkidle");

	// 1. Enter email
	const emailInput = page.locator('input[type="email"]');
	await emailInput.waitFor({ state: "visible", timeout: 20000 });

	// Click and clear just in case
	await emailInput.click();
	await emailInput.fill("");
	await emailInput.type(email, { delay: 50 });

	// Check if value is correct
	const val = await emailInput.inputValue();
	if (val !== email) {
		console.error(
			`Email input value mismatch! Expected: ${email}, Got: ${val}`,
		);
		await emailInput.fill(email); // Fallback to fill
	}

	// Wait for password view to be visible
	const passwordInput = page.locator('input[type="password"]');
	await passwordInput.waitFor({ state: "visible", timeout: 20000 });

	// Click and clear password input just in case
	await passwordInput.click();
	await passwordInput.fill("");
	await passwordInput.fill("testpassword123");

	if (page.url().includes("/signup")) {
		await page.click('button:has-text("Get Started")');
	} else {
		await page.click('button:has-text("Sign In")');
	}

	// Wait for successful redirect to notes page
	await page.waitForURL(/\/notes\/?$/, { timeout: 30000 });

	// Wait for app shell
	await expect(page.locator(".main-shell")).toBeVisible({ timeout: 20000 });

	// Give the app a moment to fully initialize WebSockets and WASM
	await page.waitForTimeout(2000);

	// Ensure vault is explicitly unlocked since we just signed in and set a password
	// Wait a bit more for rendering just in case
	await page.waitForTimeout(1000);

	// Ensure vault is unlocked explicitly via UI if needed
	const unlockOverlay = page.locator('h2', { hasText: 'Vault Locked' });
	if (await unlockOverlay.isVisible({ timeout: 2000 }).catch(() => false)) {
		const masterPassInput = page.locator('input[placeholder="Master Password"]');
		await masterPassInput.fill("testpassword123");
		await page.locator('button', { hasText: 'Unlock Vault' }).click();
		await page.waitForTimeout(1000);
		await expect(unlockOverlay).toBeHidden({ timeout: 5000 }).catch(() => {});
	}

	// Just in case it locks again, bypass appState too
	await page.evaluate(() => {
		if ((window as any).$appState) {
			(window as any).$appState.set("unlocked");
		}
	});
}

export function getUniqueNodeId() {
	return `node-${Math.random().toString(36).substr(2, 9)}`;
}

export const bypassAuthAndSetup = async (page: Page, email?: string) => {
    return authenticate(page, email);
};

export const setupE2EAuthBypass = async (page: Page) => {
	// We no longer bypass auth, tests should use `bypassAuthAndSetup`
    // which now calls `authenticate` because doing the API bypass + local storage bypass
    // isn't well tested.
};
