import { describe, expect, it } from "vitest";
import * as Y from "yjs";

describe("Collaborative Move (SC-S1)", () => {
	it("should reflect node move from Client A on Client B", () => {
		const docA = new Y.Doc();
		const docB = new Y.Doc();

		const nodesA = docA.getMap("nodes");
		const nodesB = docB.getMap("nodes");

		// Setup initial state: Folder 1
		const folderRecord = {
			id: "f1",
			parentId: null,
			type: "CHAPTER",

			name: "Old Parent",
			metadata: {},
			updatedAt: Date.now(),
		};
		nodesA.set("f1", folderRecord);

		// Initial sync
		Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

		// Client A moves a new node into Folder 1
		const nodeRecord = {
			id: "n1",
			parentId: "f1",
			type: "CHAPTER",

			name: "Moving Node",
			metadata: {},
			updatedAt: Date.now(),
		};
		nodesA.set("n1", nodeRecord);

		// Sync move to Client B
		Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

		// Verify Client B sees the correct parentId
		const bRecord = nodesB.get("n1") as any;
		expect(bRecord.parentId).toBe("f1");
	});
});
