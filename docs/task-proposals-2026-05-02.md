# Task Proposals (2026-05-02)

## 1) 入力ミス修正タスク（Typo / wording）
**Title:** Markdown 詳細設計ドキュメントの要素タイプ表記ミスを修正する

- `docs/design/5-detailed-design/markdown-engine.md` では `MarkdownElement` の例が `PARAGRAPH, HEADER, LIST, MATH` になっている。
- 実装側の型定義は `PARAGRAPH | HEADING | TABLE | IMAGE | LATEX | CODE` であり、`HEADER/LIST/MATH` は現行コードに存在しない。
- まずは文言ミス（または古い語彙）の修正として、実装に合わせて例示を更新する。

**Evidence:**
- `docs/design/5-detailed-design/markdown-engine.md`
- `packages/markdown-engine/src/types.ts`

## 2) バグ修正タスク
**Title:** `MoveNodeUseCase` の循環参照ガードで無限ループ化しうるケースを防止する

- `MoveNodeUseCase` は `newParentId` から親をたどる while ループで循環参照を検出している。
- ただし、永続層データが既に壊れていて（例: `n2 -> n3 -> n2`）`input.id` を含まないサイクルが存在すると、ループ終了条件がなくハングする可能性がある。
- `visited` セット導入や最大深さ制限で、破損データ時にも確実にエラー終了するようにする。

**Evidence:**
- `packages/core/src/application/nodes/MoveNodeUseCase.ts`

## 3) コメント/ドキュメント矛盾修正タスク
**Title:** Markdown エンジン設計書のアーキテクチャ記述を現実装へ同期する

- 設計書には `NoteViewShell`, `BlockManager`, `SyncGateway`, `EditorInterface` が登場するが、現行 `packages/markdown-engine` で同名実体が確認できない。
- 実装は `MarkdownView` と ProseMirror plugin/transaction ベースで更新・通知を行っているため、記述の更新が必要。
- 実装に存在する構成要素（`MarkdownView`, `blockIdPlugin`, `onCommand(UPDATE_ELEMENTS)`）に寄せてドキュメントを改訂する。

**Evidence:**
- `docs/design/5-detailed-design/markdown-engine.md`
- `packages/markdown-engine/src/ui/MarkdownView.tsx`

## 4) テスト改善タスク
**Title:** `MoveNodeUseCase` に「祖先探索中の既存サイクル検知」テストを追加する

- 現行テストは「移動先が自分自身または子孫」のケースは検証している。
- しかし、永続層側に既存サイクルがある異常データ（`n2 -> n3 -> n2` など）に対し、探索が停止できるかのテストがない。
- 2) のバグ修正とセットで、異常データ時に `CircularReferenceError`（または専用エラー）を投げるテストを追加する。

**Evidence:**
- `packages/core/src/application/nodes/MoveNodeUseCase.test.ts`
- `packages/core/src/application/nodes/MoveNodeUseCase.ts`
