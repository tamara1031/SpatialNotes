import { describe, expect, it } from "vitest";
import * as Y from "yjs";

describe("useSync State Integrity", () => {
	it("should merge concurrent updates correctly (CRDT property)", () => {
		const doc1 = new Y.Doc();
		const doc2 = new Y.Doc();

		const map1 = doc1.getMap("elements");
		const map2 = doc2.getMap("elements");

		map1.set("1", "A");
		map2.set("2", "B");

		// Simulate sync
		const update1 = Y.encodeStateAsUpdate(doc1);
		const update2 = Y.encodeStateAsUpdate(doc2);

		Y.applyUpdate(doc1, update2);
		Y.applyUpdate(doc2, update1);

		expect(map1.get("1")).toBe("A");
		expect(map1.get("2")).toBe("B");
		expect(map2.get("1")).toBe("A");
		expect(map2.get("2")).toBe("B");
	});
});
