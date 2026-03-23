import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import type { INodeRepository } from "../../domain/nodes/INodeRepository";
import type { Node } from "../../domain/nodes/Node";
import { NodeFactory } from "../../domain/nodes/NodeFactory";
import type { NodeRecord } from "../../domain/types";

/**
 * Experimental persistence layer using OPFS (Origin Private File System)
 * and SQLite Wasm. Provides a local-first metadata cache for E2EE nodes.
 */
export class OPFSSqliteRepository implements INodeRepository {
	private db: any = null;

	async init() {
		const sqlite3 = await (sqlite3InitModule as any)({
			print: console.log,
			printErr: console.error,
		});

		if (sqlite3.opfs) {
			this.db = new sqlite3.oo1.JsStorageDb("spatial_notes_metadata.db");
		} else {
			// Fallback to memory for testing or incompatible browsers
			this.db = new sqlite3.oo1.DB();
		}

		this.db.exec(`
			CREATE TABLE IF NOT EXISTS nodes (
				id TEXT PRIMARY KEY,
				parentId TEXT,
				userId TEXT,
				type TEXT,
				name TEXT,
				metadata TEXT,
				encryptionStrategy TEXT,
				createdAt INTEGER,
				updatedAt INTEGER,
				isDeleted INTEGER,
				position TEXT
			);
		`);
	}

	async save(node: Node): Promise<void> {
		if (!this.db) await this.init();
		const record = node.toRecord();
		this.db.exec({
			sql: `INSERT OR REPLACE INTO nodes (
				id, parentId, userId, type, name, metadata, encryptionStrategy, createdAt, updatedAt, isDeleted, position
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			bind: [
				record.id,
				record.parentId,
				record.userId,
				record.type,
				record.name || "",
				JSON.stringify(record.metadata),
				record.encryptionStrategy,
				record.createdAt,
				record.updatedAt,
				record.isDeleted ? 1 : 0,
				JSON.stringify(record.position),
			],
		});
	}

	async findById(id: string): Promise<Node | null> {
		if (!this.db) await this.init();
		const rows = this.db.exec({
			sql: "SELECT * FROM nodes WHERE id = ?",
			bind: [id],
			returnValue: "resultRows",
			rowMode: "object",
		});

		if (rows.length === 0) return null;
		return this.mapRow(rows[0]);
	}

	async findAll(userId: string): Promise<Node[]> {
		if (!this.db) await this.init();
		const rows = this.db.exec({
			sql: "SELECT * FROM nodes WHERE userId = ? AND isDeleted = 0",
			bind: [userId],
			returnValue: "resultRows",
			rowMode: "object",
		});
		return rows.map((row: any) => this.mapRow(row));
	}

	async findByParentId(
		parentId: string | null,
		userId: string,
	): Promise<Node[]> {
		if (!this.db) await this.init();
		const rows = this.db.exec({
			sql: "SELECT * FROM nodes WHERE userId = ? AND parentId = ? AND isDeleted = 0",
			bind: [userId, parentId],
			returnValue: "resultRows",
			rowMode: "object",
		});
		return rows.map((row: any) => this.mapRow(row));
	}

	private mapRow(row: any): Node {
		const record: NodeRecord = {
			id: row.id,
			parentId: row.parentId,
			userId: row.userId,
			type: row.type as any,
			name: row.name,
			metadata: JSON.parse(row.metadata),
			encryptionStrategy: row.encryptionStrategy as any,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			isDeleted: row.isDeleted === 1,
			position: row.position ? JSON.parse(row.position) : null,
		};
		return NodeFactory.create(record);
	}
}
