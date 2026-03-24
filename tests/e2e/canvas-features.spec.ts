import { expect, test } from "@playwright/test";
import {
	bypassAuthAndSetup,
	getUniqueNodeId,
	setupE2EAuthBypass,
} from "./utils/auth";

test.describe("Canvas Features (UC3, UC4)", () => {
	let testNodeId = "";
	let testNodeName = "";

	test.beforeEach(async ({ page }) => {
		testNodeId = getUniqueNodeId();
		testNodeName = `Test Notebook ${testNodeId}`;
		await setupE2EAuthBypass(page);
		await page.goto("/");
		await bypassAuthAndSetup(page);
		await page.waitForFunction(() => (window as any).ydoc !== undefined, {
			timeout: 10000,
		});
		await page.evaluate(
			async ({ id, name }) => {
				const record = {
					id,
					parentId: null,
					type: "NOTEBOOK",
					name: name,
					updatedAt: Date.now(),
					metadata: {},
				};

				// Set in Yjs
				const ydoc = (window as any).ydoc;
				const nodesMap = ydoc.getMap("nodes");
				nodesMap.set(id, record);

				// Materialize to server
				const token = localStorage.getItem("session_token");
				await fetch("/api/nodes", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(record),
				});
			},
			{ id: testNodeId, name: testNodeName },
		);
		await page.click(`text="${testNodeName}"`);
		await expect(page.locator(".canvas-surface")).toBeVisible();
		// Give WASM a moment to settle
		await page.waitForTimeout(500);
	});

	test("SC-UI3: Toolbar Layout Stability", async ({ page }) => {
		const penTool = page.getByTitle("Pen (P)");
		const highlighterTool = page.getByTitle("Highlighter (H)");

		await penTool.click();
		await expect(penTool).toBeVisible();
		await expect(highlighterTool).toBeVisible();

		// Switch to Highlighter
		await highlighterTool.click();
		await expect(highlighterTool).toBeVisible();
	});

	test("SC-S3: Robust SVG Export", async ({ page }) => {
		const surface = page.locator(".canvas-surface");

		// Draw something to export
		await surface.hover();
		await page.mouse.down();
		await page.mouse.move(200, 200);
		await page.mouse.move(300, 250);
		await page.mouse.up();

		// Trigger Export
		await page.getByTitle("Export").click();
	});

	test("SC-U10: Consecutive Multiple Strokes", async ({ page }) => {
		const surface = page.locator(".canvas-surface");
		const box = await surface.boundingBox();
		if (!box) throw new Error("Surface box not found");

		// Stroke 1
		await page.mouse.move(box.x + 100, box.y + 100);
		await page.mouse.down();
		await page.mouse.move(box.x + 150, box.y + 150);
		await page.mouse.up();

		// Stroke 2
		await page.mouse.move(box.x + 200, box.y + 100);
		await page.mouse.down();
		await page.mouse.move(box.x + 250, box.y + 150);
		await page.mouse.up();

		// Verify elements in Yjs
		const elementCount = await page.evaluate(() => {
			const ydoc = (window as any).ydoc;
			const elementsMap = ydoc.getMap("elements");
			return Array.from(elementsMap.values()).length;
		});

		expect(elementCount).toBeGreaterThanOrEqual(2);
	});
});
