import { expect, test } from "@playwright/test";
import { bypassAuthAndSetup } from "./utils/auth";

test.describe("Markdown Notebook Lifecycle", () => {
	test("Signup, Create Markdown Notebook, Edit, and Delete", async ({
		page,
	}) => {
		test.setTimeout(60000);
		// Log browser console messages
		page.on("console", (msg) =>
			console.log(`BROWSER [${msg.type()}]: ${msg.text()}`),
		);

		const suffix = Date.now();
		const userEmail = `user-${suffix}@example.com`;
		const userPassword = "Password123!";
		const notebookName = `Markdown Note ${suffix}`;

		// 1. Signup
		await bypassAuthAndSetup(page, userEmail);

		// Wait for UI to initialize
		await page.waitForTimeout(1000);

		// 3. Create Markdown Notebook explicitly via UI
		console.log("Creating new Markdown notebook via UI...");
		const createNewBtn = page.locator('button[title="Create new"]');
		await createNewBtn.waitFor({ state: "visible", timeout: 10000 });
		await createNewBtn.click();

		const newMarkdownBtn = page.locator('button', { hasText: 'New Markdown' }).first();
		await newMarkdownBtn.waitFor({ state: "visible", timeout: 10000 });
		await newMarkdownBtn.click();

		await expect(async () => {
			const count = await page.locator('.sidebar-node-item', { hasText: 'New Markdown' }).count();
			expect(count).toBeGreaterThan(0);
		}).toPass({ timeout: 20000 });

		const nodeLocator = page.locator('.sidebar-node-item', { hasText: 'New Markdown' }).first();
		await page.waitForTimeout(1000);
		await nodeLocator.click();

		// Wait for Editor to load
		const editor = page.locator(".ProseMirror").first();
		await expect(editor).toBeAttached({ timeout: 15000 });

		// 7. Edit content
		await editor.click({ force: true });
		await page.keyboard.type(
			"# Welcome to ProseMirror\n\nThis is a test paragraph.",
		);

		// Verify content rendered correctly
		const h1 = editor.locator("h1");
		await expect(h1).toHaveText("Welcome to ProseMirror");

		// 8. Test Slash Command
		await page.keyboard.type("\n/");
		const slashMenu = page.locator(".slash-menu");
		await expect(slashMenu).toBeVisible();
		await page.click("text=LaTeX");

		// Verify LaTeX block inserted
		const latexBlock = page.locator(".latex-node-view");
		await expect(latexBlock).toBeVisible();

		// Type some LaTeX
		await page.keyboard.type("e = mc^2");
		// Click outside or toggle to render
		await page.click("body"); // Click body to defocus

		// 9. Rename Notebook
		await nodeLocator.dblclick();
		await page.keyboard.type(notebookName);
		await page.keyboard.press("Enter");
		await expect(
			page.locator(`.sidebar-node-item`, { hasText: notebookName }),
		).toBeVisible({ timeout: 10000 });

		// 10. Delete Notebook
		await page.locator(`.sidebar-node-item`, { hasText: notebookName }).click(); // Select again to show delete icon
		await page.click('button[title="Delete node"]');
		await expect(
			page.locator(`.sidebar-node-item`, { hasText: notebookName }),
		).not.toBeVisible({ timeout: 10000 });
	});
});
