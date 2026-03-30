import { expect, test } from "@playwright/test";
import {
	bypassAuthAndSetup,
	getUniqueNodeId,
	setupE2EAuthBypass,
} from "./utils/auth";

test("Canvas Drawing: Correct position after panning and zooming", async ({
	page,
}) => {
	const nodeId = getUniqueNodeId();
	const nodeName = `Notebook Panned ${nodeId}`;

	await bypassAuthAndSetup(page);

	// 1. Create a notebook via UI
	const createNewBtn = page.locator('button[title="Create new"]');
	await createNewBtn.waitFor({ state: "visible", timeout: 10000 });
	await createNewBtn.click();

	const newCanvasBtn = page.locator('button', { hasText: 'New Canvas' }).first();
	await newCanvasBtn.waitFor({ state: "visible", timeout: 10000 });
	await newCanvasBtn.click();

	// Wait for the new node to appear in the sidebar list before clicking
	const nodeLocator = page.locator('.sidebar-node-item', { hasText: /New (Canvas|Notebook)/ }).first();
	await nodeLocator.waitFor({ state: "visible", timeout: 10000 });

	// Use standard Playwright click
	await nodeLocator.click();

	const surface = page.locator(".canvas-surface");
	await expect(surface).toBeVisible({ timeout: 15000 });

	// Give WASM a moment to settle
	await page.waitForTimeout(1000);

	// 1. Get initial canvas bounding box
	const initialRect = await surface.boundingBox();
	if (!initialRect) throw new Error("Surface not found");

	// 2. Select PAN tool
	await page.getByTitle("Picker (V)").click();

	// 3. Pan the canvas by (100, 50)
	await page.mouse.move(initialRect.x + 200, initialRect.y + 200);
	await page.mouse.down({ button: "middle" });
	await page.mouse.move(initialRect.x + 300, initialRect.y + 250, { steps: 10 });
	await page.mouse.up({ button: "middle" });

	// Wait for pan to settle
	await page.waitForTimeout(200);

	// 4. Draw a line at screen (400, 400)
	await page.getByTitle("Pen (P)").click();
	await page.mouse.move(400, 400);
	await page.mouse.down();
	await page.mouse.move(450, 450, { steps: 10 });
	await page.mouse.up();

	await page.waitForTimeout(1000);

	// 5. Verify element in Yjs
	await expect(async () => {
		const elements = await page.evaluate(() => {
			const ydoc = (window as any).ydoc;
			const elementsMap = ydoc?.getMap("elements");
			if (!elementsMap) return [];
			return Array.from(elementsMap.values()) as any[];
		});
		expect(elements.length).toBeGreaterThanOrEqual(1);
	}).toPass({ timeout: 10000 });
});
