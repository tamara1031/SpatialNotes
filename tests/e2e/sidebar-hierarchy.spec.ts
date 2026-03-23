import { expect, test } from "@playwright/test";
import { bypassAuthAndSetup, setupE2EAuthBypass } from "./utils/auth";

test("Sidebar Hierarchy: Live Data", async ({ page }) => {
	page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
	await setupE2EAuthBypass(page);
	await page.goto("/");
	await bypassAuthAndSetup(page);

	const sidebar = page.locator('div:has(span:has-text("Notebooks"))').first();
	await expect(sidebar).toBeVisible();

	// Inject data into Yjs map
	await page.waitForFunction(() => (window as any).ydoc !== undefined, {
		timeout: 10000,
	});
	await page.evaluate(() => {
		const ydoc = (window as any).ydoc;
		const nodesMap = ydoc.getMap("nodes");
		nodesMap.set("f1", {
			id: "f1",
			parentId: null,
			type: "CHAPTER",
			name: "Folder 1",
			updatedAt: Date.now(),
		});
		nodesMap.set("n1", {
			id: "n1",
			parentId: "f1",
			type: "NOTEBOOK",
			name: "Notebook 1.1",
			updatedAt: Date.now(),
		});
		// Note: PAGE is not a first-class node type in the current implementation, CHAPTER and NOTEBOOK are.
	});

	// Verify rendered hierarchy
	const folder = page.locator('text="Folder 1"');
	const notebook = page.locator('text="Notebook 1.1"');

	await expect(folder).toBeVisible();
	await expect(notebook).toBeVisible();
});
