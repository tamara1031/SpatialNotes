import { expect, test } from "@playwright/test";
import {
	bypassAuthAndSetup,
	getUniqueNodeId,
	setupE2EAuthBypass,
} from "./utils/auth";

test("The Golden Path: Canvas Sync across windows", async ({
	context,
	page,
}) => {
	const nodeId = getUniqueNodeId();
	const nodeName = `Notebook Sync ${nodeId}`;
	const userEmail = `sync-test-${nodeId}@example.com`;

	await bypassAuthAndSetup(page, userEmail);

	// 1. Create a notebook via UI
	const createNewBtn = page.locator('button[title="Create new"]');
	await createNewBtn.waitFor({ state: "visible", timeout: 10000 });
	await createNewBtn.click();

	const newCanvasBtn = page.locator('button', { hasText: 'New Canvas' }).first();
	await newCanvasBtn.waitFor({ state: "visible", timeout: 10000 });
	await newCanvasBtn.click();

	// Wait for the new node to appear in the sidebar list before clicking
	const nodeLocator = page.locator('.sidebar-node-item', { hasText: /New Notebook/ }).first();
	await nodeLocator.waitFor({ state: "visible", timeout: 10000 });

	// Use standard Playwright click
	await nodeLocator.click();

	const surface = page.locator(".canvas-surface");
	await expect(surface).toBeVisible({ timeout: 15000 });

	// Give it a moment to initialize the engine
	await page.waitForTimeout(1000);

	// Draw a stroke
	const box = await surface.boundingBox();
	if (!box) throw new Error("Surface box not found");

	await page.mouse.move(box.x + 100, box.y + 100);
	await page.mouse.down();
	await page.mouse.move(box.x + 200, box.y + 200);
	await page.mouse.up();

	await page.waitForTimeout(1000);

	// Verify element exists in LOCAL Yjs map
	await expect(async () => {
		const count = await page.evaluate(() => {
			const ydoc = (window as any).ydoc;
			const elementsMap = ydoc?.getMap("elements");
			if (!elementsMap) return 0;
			return Array.from(elementsMap.values()).length;
		});
		console.log(`Local elements: ${count}`);
		expect(count).toBeGreaterThanOrEqual(1);
	}).toPass({ timeout: 10000 });

	// Open second window
	const page2 = await context.newPage();
	await bypassAuthAndSetup(page2, userEmail);

	// Second window needs to find the newly created canvas in the sidebar
	// since it synced via Yjs
	const nodeLocator2 = page2.locator('.sidebar-node-item', { hasText: /New Notebook/ }).first();
	await nodeLocator2.waitFor({ state: "visible", timeout: 10000 });

	// Use standard Playwright click
	await nodeLocator2.click();

	const surface2 = page2.locator(".canvas-surface");
	await expect(surface2).toBeVisible({ timeout: 15000 });

	await page2.waitForTimeout(1000);

	// Verify synchronization
	await expect(async () => {
		const count = await page2.evaluate(() => {
			const ydoc = (window as any).ydoc;
			const elementsMap = ydoc?.getMap("elements");
			if (!elementsMap) return 0;
			return Array.from(elementsMap.values()).length;
		});
		console.log(`Remote elements: ${count}`);
		expect(count).toBeGreaterThanOrEqual(1);
	}).toPass({ timeout: 10000 });
});
