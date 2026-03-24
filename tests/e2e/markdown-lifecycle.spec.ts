import { expect, test } from "@playwright/test";

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
		await page.goto("/signup/");
		await page.fill('input[type="email"]', userEmail);
		await page.fill('input[type="password"]', userPassword);
		await page.click('button[type="submit"]');

		// Wait for the success message or redirection
		console.log("Waiting for redirection after signup...");
		await expect(page).toHaveURL(/\/notes\/?$/, { timeout: 30000 });
		console.log("Redirected to notes successfully.");

		// Wait for overlays to clear
		await expect(page.locator("text=Setup your Vault")).not.toBeVisible({
			timeout: 10000,
		});
		await expect(page.locator("text=Unlock your Vault")).not.toBeVisible({
			timeout: 10000,
		});
		await expect(page.locator("text=Enter your Email")).not.toBeVisible({
			timeout: 10000,
		});

		// 3. Create Markdown Notebook
		// Click the "Create new" button
		await page.click('button[title="Create new"]');
		// Click "New Markdown"
		await page.click("text=New Markdown");

		// 4. Verify notebook appears in sidebar
		const sidebarItem = page.locator(`.sidebar >> text=New Markdown`);
		await expect(sidebarItem).toBeVisible({ timeout: 10000 });

		// 5. Select the notebook
		await sidebarItem.click();

		// 6. Wait for Editor to load
		const editor = page.locator(".ProseMirror");
		await expect(editor).toBeVisible({ timeout: 10000 });

		// 7. Edit content
		await editor.click();
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
		await sidebarItem.dblclick();
		await page.keyboard.type(notebookName);
		await page.keyboard.press("Enter");
		await expect(
			page.locator(`.sidebar >> text=${notebookName}`),
		).toBeVisible();

		// 10. Delete Notebook
		await page.click(`.sidebar >> text=${notebookName}`); // Select again to show delete icon
		await page.click('button[title="Delete node"]');
		await expect(
			page.locator(`.sidebar >> text=${notebookName}`),
		).not.toBeVisible();
	});
});
