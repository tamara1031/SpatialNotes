import { expect, type Page } from "@playwright/test";

/**
 * Performs a real registration or login flow.
 */
export async function authenticate(
	page: Page,
	email: string = `test-${Math.random().toString(36).substr(2, 9)}@example.com`,
) {
	console.log(`Authenticating with email: ${email}`);

	// Ensure we are on a page where the auth overlay can appear
	if (
		page.url() === "about:blank" ||
		page.url().includes("/signup") ||
		page.url().includes("/signin")
	) {
		await page.goto("/notes/");
	}

	// 1. Enter email
	const emailInput = page.locator('input[placeholder="Email Address"]');
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

	const continueBtn = page.locator('button:has-text("Continue")');
	await continueBtn.click();

	// 2. Wait for either Setup or Unlock view
	console.log("Waiting for Setup or Unlock view...");
	const setupView = page.locator('text="Setup your Vault"');
	const unlockView = page.locator('text="Vault Locked"');

	await expect(async () => {
		const isSetup = await setupView.isVisible();
		const isUnlock = await unlockView.isVisible();
		if (!isSetup && !isUnlock) {
			// Re-click continue if it seems stuck
			if (
				(await continueBtn.isVisible()) &&
				!(await continueBtn.isDisabled())
			) {
				await continueBtn.click();
			}
			throw new Error("Neither Setup nor Unlock view is visible");
		}
	}).toPass({ timeout: 15000 });

	const isSetup = await setupView.isVisible();
	console.log(`Flow determined: ${isSetup ? "Setup" : "Unlock"}`);

	const passwordInput = page.locator('input[placeholder="Master Password"]');
	await passwordInput.fill("testpassword123");

	if (isSetup) {
		const confirmInput = page.locator('input[placeholder="Confirm Password"]');
		await confirmInput.fill("testpassword123");
		await page.click('button:has-text("Create Account")');
	} else {
		await page.click('button:has-text("Unlock Vault")');
	}

	// 3. Wait for success
	await expect(page.locator('text="Connecting to Vault..."')).toBeHidden({
		timeout: 20000,
	});
	await expect(page.locator(".main-shell")).toBeVisible({ timeout: 20000 });

	await page.waitForTimeout(1000);
}

export function getUniqueNodeId() {
	return `node-${Math.random().toString(36).substr(2, 9)}`;
}

export const bypassAuthAndSetup = authenticate;
export const setupE2EAuthBypass = async (page: Page) => {
	// We need to be on the domain to set localStorage
	if (page.url() === "about:blank") {
		await page.goto("/");
	}
	await page.evaluate(() => {
		localStorage.setItem("session_token", "test-bypass-token");
	});
};
