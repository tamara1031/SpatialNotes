# SpatialNotes — Claude Code Harness Instructions

## Project Overview

**SpatialNotes: The Magic Desk** は空間的ノートアプリ。Go バックエンド・Astro フロントエンド・Rust/Wasm キャンバスエンジンで構成されるモノレポ。

## Architecture (必ず読む)

DDD + Island Architecture。変更時は必ずレイヤー境界を意識すること。

```
apps/
  web/src/          — Astro UI シェル（Island Architecture）
  server/internal/
    application/    — HTTP ハンドラ・サービスインタフェース（Go）
    service/        — サービス実装・リポジトリインタフェース・エンティティ（Go）
    repository/     — リポジトリ実装 SQL（Go）
    infrastructure/ — SQLite・ストレージクライアント（Go）
packages/
  core/src/         — 共有ドメインロジック・型（TS）
  engine-core/src/  — ワーカー RPC クライアント・型（TS/Vitest）
  canvas-engine/    — キャンバス高レベルアダプタ（TS/Vitest）
  canvas-wasm/      — 高性能 Rust キャンバスエンジン（Wasm）
  markdown-engine/  — Markdown レンダリングアダプタ（TS）
  markdown-wasm/    — Markdown/LaTeX Rust エンジン（Wasm）
docs/design/adr/    — 設計判断の ADR（変更前に必ず参照）
tests/e2e/          — Playwright E2E テスト
```

## Key Commands

| 目的 | コマンド |
|------|----------|
| 初回セットアップ | `make setup` |
| 開発サーバ起動 | `make dev` |
| Wasm ビルドのみ | `make build-wasm` |
| 全本番ビルド | `make build` |
| 全ユニットテスト | `pnpm test` |
| E2E テスト | `pnpm test:e2e` |
| Lint (Biome + Go) | `pnpm lint` |
| 環境確認 | `make check-env` |

> **注意**: `make dev` は `build-wasm` を自動実行する。Rust/wasm-pack が必要。

## Tech Stack

- **Go 1.25** (backend): bun ORM / SQLite / JWT 認証
- **Astro + React** (frontend): Island Architecture、pnpm ワークスペース
- **Rust + wasm-pack** (canvas/markdown-wasm): `packages/canvas-wasm`, `packages/markdown-wasm`
- **TypeScript** (engine-core, core): Vitest でテスト
- **Biome** (linter/formatter): タブインデント、`pnpm lint`

## Test Strategy (ADR-008, ADR-010)

- **Go**: `go test ./...` または `pnpm test` 経由。`apps/server/internal/service/` 配下に service テスト集中
- **engine-core**: `pnpm --filter engine-core test`（Vitest）
- **canvas-engine**: `pnpm --filter canvas-engine test`（Vitest）
- **web**: `pnpm --filter web test`（Vitest）
- **E2E**: Playwright (`tests/e2e/`) — ゴールデンパスは `golden-path.spec.ts`
- **全ユニットテスト一括**: `pnpm test`（canvas-engine + web が対象）
- テスト追加時は ADR-008（統合スタック）・ADR-010（行動テスト）を参照

## Key ADRs (変更前に確認)

| ADR | 概要 |
|-----|------|
| 001 | ハイブリッドパーティションモデル |
| 002 | ポリモーフィックノードモデル |
| 008 | 統合スタックテスト |
| 012 | DB 抽象化 |
| 016 | ディレクトリ構造 |
| 017 | Local-First 永続化戦略 |
| 019 | 同期プロトコル (Yjs/WebSocket) |
| 020 | Astro Wasm Island Architecture |
| 021 | Full Rust インクエンジン |

## Agent Guidance (easy-agent 向け)

### TaskType ヒント

- **Go サービス/リポジトリの単一メソッド修正（AmbiguityLevel: LOW、既存パターン踏襲）** → `execute` (Small)
- **Go サービス/リポジトリの単一メソッド修正（新規ドメイン状態・未定義シグネチャが含まれる場合）** → `hybrid` (Mid)
- **TS パッケージ（canvas-engine / engine-core / core）の単一メソッド追加＋テスト（既存パターン踏襲）** → `execute` (Mid: 実装ファイル + テストファイル)
- **新フィールドのドメイン伝播 (service → repository → handler)** → `hybrid` (Mid/Large)
- **ADR に抵触する可能性のある設計変更** → `designExecute` (要 Parliament)
- **コード調査・ADR 読解のみ** → `research`

### Go サービス層の規約

- **userID 取得**: サービスメソッドは `userID` を明示的引数でなく context から取得する（`getUserID(ctx)` パターン）。新規メソッド追加時はこの規約に倣う
- **HTTP シリアライズ**: `service/node.go` の `BaseNode` は独自 `MarshalJSON` を実装している。フィールド追加時は `MarshalJSON` の更新も必須
- **リポジトリインタフェース**: 新規メソッドを service に追加した場合は `service/repository_interfaces.go` のインタフェースと `service/fakes_test.go` の Fake 実装も同時に更新が必要
- **Node ライフサイクル**: 現時点で Node エンティティの状態は `active`（通常）と soft-deleted（`is_deleted = true`）の2種類のみ。`is_archived` など新規ドメイン状態は存在せず、追加には DB スキーマ変更と Confirmation Gate が必要

### よくある落とし穴

1. **Wasm ビルドを忘れる**: canvas/markdown 機能の変更後は `make build-wasm` が必要
2. **レイヤー越え直接呼び出し**: `repository` を `application` から直接呼ばない（`service` 経由）
3. **ADR 未確認の設計変更**: `docs/design/adr/` に既存判断がある場合は必ず確認
4. **pnpm vs npm**: このプロジェクトは pnpm 専用。`npm install` を使わない
5. **MarshalJSON の更新漏れ**: `BaseNode` にフィールドを追加した際は MarshalJSON も更新しないと HTTP レスポンスに含まれない

### Confirmation Gate が必要なケース

- `apps/server/internal/` の複数レイヤーをまたぐ変更（Mid → Large 格上げの可能性）
- `packages/canvas-wasm/` または `packages/markdown-wasm/` への変更（Rust ビルドが必要）
- DB マイグレーションや `spatial_notes.db` の schema 変更（選択肢: `ALTER TABLE` 追加 or 開発環境では DB 再作成。本番相当環境では必ず `ALTER TABLE` を選ぶ）
