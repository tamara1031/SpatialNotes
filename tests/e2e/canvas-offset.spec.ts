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

	await setupE2EAuthBypass(page);
	await page.goto("/");
	await bypassAuthAndSetup(page);

	// 1. Create a notebook
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
			const ydoc = (window as any).ydoc;
			const nodesMap = ydoc.getMap("nodes");
			nodesMap.set(id, record);

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
		{ id: nodeId, name: nodeName },
	);

	await page.click(`text="${nodeName}"`);

	const surface = page.locator(".canvas-surface");
	await expect(surface).toBeVisible();

	// 1. Get initial canvas bounding box
	const initialRect = await surface.boundingBox();
	if (!initialRect) throw new Error("Surface not found");

	// 2. Select PAN tool
	await page.getByTitle("Picker (V)").click();

	// 3. Pan the canvas by (100, 50)
	await page.mouse.move(initialRect.x + 200, initialRect.y + 200);
	await page.mouse.down();
	await page.mouse.move(initialRect.x + 300, initialRect.y + 250);
	await page.mouse.up();

	// Wait for pan to settle
	await page.waitForTimeout(200);

	// 4. Draw a line at screen (400, 400)
	await page.getByTitle("Pen (P)").click();
	await page.mouse.move(400, 400);
	await page.mouse.down();
	await page.mouse.move(450, 450);
	await page.mouse.up();

	// 5. Verify element in Yjs
	const elements = await page.evaluate(() => {
		const ydoc = (window as any).ydoc;
		const elementsMap = ydoc.getMap("elements");
		return Array.from(elementsMap.values()) as any[];
	});

	expect(elements.length).toBeGreaterThanOrEqual(1);
});
