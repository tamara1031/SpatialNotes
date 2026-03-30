import { expect, test } from "@playwright/test";
import { bypassAuthAndSetup, setupE2EAuthBypass } from "./utils/auth";

test("Sidebar Hierarchy: Live Data", async ({ page }) => {
	page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
	await bypassAuthAndSetup(page);

	const sidebar = page.locator('div:has(span:has-text("Notebooks"))').first();
	await expect(sidebar).toBeVisible();

	// Inject data into Yjs map
	await page.waitForFunction(() => (window as any).ydoc !== undefined, {
		timeout: 10000,
	});
	await page.evaluate(async () => {
		const ydoc = (window as any).ydoc;
		const nodesMap = ydoc.getMap("nodes");
		const authUserStr = localStorage.getItem("spatial_notes_last_user");
		const authUser = authUserStr ? { id: authUserStr } : { id: "test" };
		const f1 = {
			id: "f1",
			parentId: null,
			type: "CHAPTER",
			name: "Folder 1",
			updatedAt: Date.now(),
			createdAt: Date.now(),
			isDeleted: false,
			metadata: {},
			userId: authUser.id,
			encryptionStrategy: "STANDARD",
			nonce: ""
		};
		const n1 = {
			id: "n1",
			parentId: "f1",
			type: "NOTEBOOK",
			name: "Notebook 1.1",
			updatedAt: Date.now(),
			createdAt: Date.now(),
			isDeleted: false,
			metadata: {},
			userId: authUser.id,
			encryptionStrategy: "STANDARD",
			nonce: ""
		};
		nodesMap.set("f1", f1);
		nodesMap.set("n1", n1);

		const token = localStorage.getItem("session_token");
		await fetch("/api/nodes", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(f1),
		});
		await fetch("/api/nodes", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(n1),
		});
	});

	await page.evaluate(() => {
		(window as any).ydoc.transact(() => {
			const nodesMap = (window as any).ydoc.getMap("nodes");
			nodesMap.set("f1", nodesMap.get("f1"));
		}, "trigger-update");
	});

	await page.waitForTimeout(1000);

	// Verify rendered hierarchy
	const folder = page.locator('text="Folder 1"').first();
	const notebook = page.locator('text="Notebook 1.1"').first();

	await expect(folder).toBeVisible({ timeout: 10000 });
	await expect(notebook).toBeVisible({ timeout: 10000 });
});
