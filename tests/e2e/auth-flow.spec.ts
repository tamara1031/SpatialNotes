import { expect, test } from "@playwright/test";

test.describe("Astro Auth Flow & Redirection", () => {
	test("Guest should stay on landing page", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveURL(/\/$/);
		await expect(page.locator("h1").first()).toContainText("A Spatial Canvas");
	});

	test("Authenticated user should NOT be redirected from root automatically", async ({
		page,
	}) => {
		await page.goto("/");
		// Simulate login
		await page.evaluate(() => {
			localStorage.setItem("session_token", "test-token");
		});

		// Reload
		await page.goto("/");

		// Should STILL be on root
		await expect(page).toHaveURL(/\/$/);

		// Wait for client-side script to show Go to Notes button
		await expect(page.locator("text=Go to Notes").first()).toBeVisible();
	});

	test("Authenticated user should be redirected from /signin/ to /notes/", async ({
		page,
	}) => {
		await page.goto("/signin/");
		await page.evaluate(() => {
			localStorage.setItem("session_token", "test-token");
		});
		await page.goto("/signin/");
		await expect(page).toHaveURL(/\/notes\/?$/);
	});

	test("Deep link to /signin/ should work for guests", async ({ page }) => {
		await page.goto("/signin/");
		await expect(page).toHaveURL(/\/signin\/?$/);
		await expect(page.locator("h2")).toContainText("Welcome Back");
	});

	test("Deep link to /signup/ should work for guests", async ({ page }) => {
		await page.goto("/signup/");
		await expect(page).toHaveURL(/\/signup\/?$/);
		await expect(page.locator("h2")).toContainText("Join SpatialNotes");
	});

	test("Clicking 'Sign Up' link on Sign In page should navigate to /signup/", async ({
		page,
	}) => {
		await page.goto("/signin/");
		await page.click("text=Sign Up");
		await expect(page).toHaveURL(/\/signup\/?$/);
	});
});
