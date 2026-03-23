import { describe, expect, it } from "vitest";
import * as Y from "yjs";

describe("Yjs Convergence (SC-I3)", () => {
	it("should reach identical state after concurrent map updates", () => {
		const docA = new Y.Doc();
		const docB = new Y.Doc();

		const mapA = docA.getMap("elements");
		const mapB = docB.getMap("elements");

		// Concurrent updates
		docA.transact(() => {
			mapA.set("stroke-1", { points: [0, 0, 10, 10] });
		});
		docB.transact(() => {
			mapB.set("stroke-2", { points: [20, 20, 30, 30] });
		});

		// Cross-apply updates
		const updateA = Y.encodeStateAsUpdate(docA);
		const updateB = Y.encodeStateAsUpdate(docB);

		Y.applyUpdate(docA, updateB);
		Y.applyUpdate(docB, updateA);

		// Verify identical state
		const jsonA = mapA.toJSON();
		const jsonB = mapB.toJSON();

		expect(jsonA).toEqual(jsonB);
		expect(jsonA["stroke-1"]).toBeDefined();
		expect(jsonA["stroke-2"]).toBeDefined();
	});

	it("should resolve conflicts using Yjs internal logic (LWW)", () => {
		const docA = new Y.Doc();
		const docB = new Y.Doc();

		const mapA = docA.getMap("metadata");
		const mapB = docB.getMap("metadata");

		// Set initial state
		mapA.set("name", "Original");
		const initialState = Y.encodeStateAsUpdate(docA);
		Y.applyUpdate(docB, initialState);

		// Concurrent conflicting updates
		mapA.set("name", "Changed by A");
		mapB.set("name", "Changed by B");

		const updateA = Y.encodeStateAsUpdate(docA);
		const updateB = Y.encodeStateAsUpdate(docB);

		Y.applyUpdate(docA, updateB);
		Y.applyUpdate(docB, updateA);

		expect(mapA.get("name")).toBe(mapB.get("name"));
	});
});
