import type { NodeRecord } from "@spatial-notes/core";
import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { dispatchCommand } from "../../src/commands/commandDispatcher";
import type { EngineCommand } from "../../src/commands/types";

const makeRecord = (overrides: Partial<NodeRecord> = {}): NodeRecord => ({
	id: "el-1",
	parentId: null,
	userId: "u1",
	type: "ELEMENT_STROKE",
	metadata: { stub: true },
	encryptionStrategy: "STANDARD",
	createdAt: 0,
	updatedAt: 0,
	...overrides,
});

describe("dispatchCommand (ADR-030, ADR-051)", () => {
	let doc: Y.Doc;
	let elementsMap: Y.Map<NodeRecord>;
	let nodesMap: Y.Map<NodeRecord>;

	beforeEach(() => {
		doc = new Y.Doc();
		elementsMap = doc.getMap<NodeRecord>("elements");
		nodesMap = doc.getMap<NodeRecord>("nodes");
	});

	it("CREATE writes a record to the elements map", () => {
		const record = makeRecord();
		dispatchCommand({ type: "CREATE", payload: record }, { elementsMap, nodesMap });
		expect(elementsMap.get("el-1")).toEqual(record);
	});

	it("DELETE removes by id", () => {
		elementsMap.set("el-1", makeRecord());
		dispatchCommand(
			{ type: "DELETE", payload: { id: "el-1" } },
			{ elementsMap, nodesMap },
		);
		expect(elementsMap.has("el-1")).toBe(false);
	});

	it("UPDATE_ELEMENTS applies deltas to existing records and bumps updatedAt", () => {
		elementsMap.set("el-1", makeRecord({ metadata: { x: 1, y: 2 } }));
		const before = Date.now();
		dispatchCommand(
			{
				type: "UPDATE_ELEMENTS",
				payload: [{ id: "el-1", changes: { metadata: { x: 10 } } }],
			},
			{ elementsMap, nodesMap },
		);
		const updated = elementsMap.get("el-1");
		expect(updated?.metadata).toEqual({ x: 10, y: 2 });
		expect(updated?.updatedAt).toBeGreaterThanOrEqual(before);
	});

	it("UPDATE_ELEMENTS silently skips missing records", () => {
		dispatchCommand(
			{
				type: "UPDATE_ELEMENTS",
				payload: [{ id: "missing", changes: { name: "x" } }],
			},
			{ elementsMap, nodesMap },
		);
		expect(elementsMap.has("missing")).toBe(false);
	});

	it("UPDATE_NODE merges into the targeted node", () => {
		nodesMap.set(
			"n1",
			makeRecord({ id: "n1", type: "NOTEBOOK", encryptionStrategy: "STANDARD" }),
		);
		dispatchCommand(
			{
				type: "UPDATE_NODE",
				payload: { id: "n1", encryptionStrategy: "E2EE" },
			},
			{ elementsMap, nodesMap },
		);
		expect(nodesMap.get("n1")?.encryptionStrategy).toBe("E2EE");
	});

	it("BATCH dispatches children inside a single Yjs transaction", () => {
		elementsMap.set("el-1", makeRecord());
		let transactionCount = 0;
		doc.on("afterTransaction", () => {
			transactionCount++;
		});

		const batch: EngineCommand = {
			type: "BATCH",
			payload: [
				{ type: "CREATE", payload: makeRecord({ id: "el-2" }) },
				{ type: "DELETE", payload: { id: "el-1" } },
			],
		};
		dispatchCommand(batch, { elementsMap, nodesMap });

		expect(elementsMap.has("el-1")).toBe(false);
		expect(elementsMap.has("el-2")).toBe(true);
		expect(transactionCount).toBe(1);
	});
});
