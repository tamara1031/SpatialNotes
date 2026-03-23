import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { YjsStoreAdapter } from "../../src/infrastructure/storage/YjsStoreAdapter";

describe("YjsStoreAdapter Binary Merge (SC-I3)", () => {
	it("should converge state using binary updates and YjsStoreAdapter", () => {
		const docA = new Y.Doc();
		const docB = new Y.Doc();
		const mapA = docA.getMap<string>("elements");
		const mapB = docB.getMap<string>("elements");
		const adapterA = new YjsStoreAdapter(mapA);
		const adapterB = new YjsStoreAdapter(mapB);

		// Concurrent updates via adapter
		adapterA.set("1", "Alpha");
		adapterB.set("2", "Beta");

		// Exchange binary updates via Yjs Doc
		const updateA = Y.encodeStateAsUpdate(docA);
		const updateB = Y.encodeStateAsUpdate(docB);

		Y.applyUpdate(docA, updateB);
		Y.applyUpdate(docB, updateA);

		// Verify convergence
		expect(adapterA.get("1")).toBe("Alpha");
		expect(adapterA.get("2")).toBe("Beta");
		expect(adapterB.get("1")).toBe("Alpha");
		expect(adapterB.get("2")).toBe("Beta");
		expect(mapA.toJSON()).toEqual(mapB.toJSON());
	});
});
