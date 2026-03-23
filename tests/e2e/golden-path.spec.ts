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

	await setupE2EAuthBypass(page);
	await page.goto("/");
	await bypassAuthAndSetup(page, userEmail);

	// 1. Create a notebook and MATERIALIZE it
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
				metadata: { engineType: "CANVAS" },
			};

			// Set in Yjs
			const ydoc = (window as any).ydoc;
			const nodesMap = ydoc.getMap("nodes");
			nodesMap.set(id, record);

			// Materialize to server using the real token from localStorage
			const token = localStorage.getItem("session_token");
			await fetch("/api/nodes", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(record),
			});

			// DIRECTLY SET ACTIVE NODE for stable testing
			const noteStore = await import("../store/noteStore");
			noteStore.$activeNodeId.set(id);
		},
		{ id: nodeId, name: nodeName },
	);

	const surface = page.locator(".canvas-surface");
	await expect(surface).toBeVisible({ timeout: 10000 });

	// Give it a moment to initialize the engine
	await page.waitForTimeout(1000);

	// Draw a stroke
	const box = await surface.boundingBox();
	if (!box) throw new Error("Surface box not found");

	await page.mouse.move(box.x + 100, box.y + 100);
	await page.mouse.down();
	await page.mouse.move(box.x + 200, box.y + 200);
	await page.mouse.up();

	// Verify element exists in LOCAL Yjs map
	await expect(async () => {
		const count = await page.evaluate(() => {
			const ydoc = (window as any).ydoc;
			const elementsMap = ydoc.getMap("elements");
			return Array.from(elementsMap.values()).length;
		});
		console.log(`Local elements: ${count}`);
		expect(count).toBeGreaterThanOrEqual(1);
	}).toPass({ timeout: 5000 });

	// Open second window
	const page2 = await context.newPage();
	await setupE2EAuthBypass(page2);
	await page2.goto("/");
	await bypassAuthAndSetup(page2, userEmail);

	// Set active node directly in second window too
	await page2.evaluate(
		({ id }) => {
			(window as any).setActiveNodeIdForTest = (noteId: string) => {
				// Find the activeNodeId atom and set it
				// This is a bit hacky but ensures the test doesn't depend on sidebar UI
				const nodesMap = (window as any).ydoc.getMap("nodes");
				if (nodesMap.has(noteId)) {
					// We need a way to reach the atom. Let's expose it in DesktopApp or noteStore.
					(window as any).$activeNodeId.set(noteId);
				}
			};
			(window as any).setActiveNodeIdForTest(id);
		},
		{ id: nodeId },
	);

	const surface2 = page2.locator(".canvas-surface");
	await expect(surface2).toBeVisible({ timeout: 10000 });

	// Verify synchronization
	await expect(async () => {
		const count = await page2.evaluate(() => {
			const ydoc = (window as any).ydoc;
			const elementsMap = ydoc.getMap("elements");
			return Array.from(elementsMap.values()).length;
		});
		console.log(`Remote elements: ${count}`);
		expect(count).toBeGreaterThanOrEqual(1);
	}).toPass({ timeout: 10000 });
});
