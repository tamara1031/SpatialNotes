import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import type { INodeRepository } from "../../domain/nodes/INodeRepository.js";
import type { Node } from "../../domain/nodes/Node.js";
import { NodeFactory } from "../../domain/nodes/NodeFactory.js";
import type {
	EncryptionStrategy,
	NodeRecord,
	NodeType,
} from "../../domain/types.js";

// Minimal structural interfaces for the untyped @sqlite.org/sqlite-wasm OO1 API.
// We only model the subset used by this repository.

interface SqliteNodeRow {
	id: string;
	parentId: string | null;
	userId: string;
	type: string;
	name: string;
	metadata: string;
	encryptionStrategy: string;
	createdAt: number;
	updatedAt: number;
	isDeleted: number;
	position: string | null;
}

interface Sqlite3OO1DB {
	exec(sql: string): void;
	exec(options: { sql: string; bind?: (string | number | null)[] }): void;
	exec(options: {
		sql: string;
		bind?: (string | number | null)[];
		returnValue: "resultRows";
		rowMode: "object";
	}): SqliteNodeRow[];
}

interface Sqlite3Module {
	opfs?: unknown;
	oo1: {
		JsStorageDb: new (name: string) => Sqlite3OO1DB;
		DB: new () => Sqlite3OO1DB;
	};
}

/**
 * Experimental persistence layer using OPFS (Origin Private File System)
 * and SQLite Wasm. Provides a local-first metadata cache for E2EE nodes.
 */
export class OPFSSqliteRepository implements INodeRepository {
	private db: Sqlite3OO1DB | null = null;

	async init() {
		const sqlite3 = await (
			sqlite3InitModule as unknown as (opts: {
				print: typeof console.log;
				printErr: typeof console.error;
			}) => Promise<Sqlite3Module>
		)({
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

	private async requireDb(): Promise<Sqlite3OO1DB> {
		if (!this.db) await this.init();
		// biome-ignore lint/style/noNonNullAssertion: init() always sets this.db
		return this.db!;
	}

	async save(node: Node): Promise<void> {
		const db = await this.requireDb();
		const record = node.toRecord();
		db.exec({
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
		const db = await this.requireDb();
		const rows = db.exec({
			sql: "SELECT * FROM nodes WHERE id = ?",
			bind: [id],
			returnValue: "resultRows",
			rowMode: "object",
		});

		if (rows.length === 0) return null;
		return this.mapRow(rows[0]);
	}

	async findAll(userId: string): Promise<Node[]> {
		const db = await this.requireDb();
		const rows = db.exec({
			sql: "SELECT * FROM nodes WHERE userId = ? AND isDeleted = 0",
			bind: [userId],
			returnValue: "resultRows",
			rowMode: "object",
		});
		return rows.map((row) => this.mapRow(row));
	}

	async findByParentId(
		parentId: string | null,
		userId: string,
	): Promise<Node[]> {
		const db = await this.requireDb();
		const rows = db.exec({
			sql: "SELECT * FROM nodes WHERE userId = ? AND parentId = ? AND isDeleted = 0",
			bind: [userId, parentId],
			returnValue: "resultRows",
			rowMode: "object",
		});
		return rows.map((row) => this.mapRow(row));
	}

	private mapRow(row: SqliteNodeRow): Node {
		const record: NodeRecord = {
			id: row.id,
			parentId: row.parentId,
			userId: row.userId,
			type: row.type as NodeType,
			name: row.name,
			metadata: JSON.parse(row.metadata) as Record<string, unknown>,
			encryptionStrategy: row.encryptionStrategy as EncryptionStrategy,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			isDeleted: row.isDeleted === 1,
			position: row.position
				? (JSON.parse(row.position) as { x: number; y: number })
				: null,
		};
		return NodeFactory.create(record);
	}
}
