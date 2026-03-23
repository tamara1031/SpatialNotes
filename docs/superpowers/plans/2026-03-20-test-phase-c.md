# Test Implementation (Phase C: Advanced Interactions) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement quality gates for gesture-based erasure and PDF export fidelity.

**Architecture:** Behavioral tests for spatial intersection and snapshot-based visual regression.

**Tech Stack:** TypeScript, Vitest, packages/core.

---

### Task 1: Atomic Erasure Logic (SC-S2)

**Files:**
- Create: `packages/core/tests/domain/Eraser.test.ts`
- Create: `packages/core/src/domain/IntersectionVisitor.ts`

- [ ] **Step 1: Write failing test for gesture intersection**

```typescript
import { describe, it, expect } from 'vitest';
// ... setup Page with 2 Strokes
// ... simulate Eraser Path intersecting 1 Stroke
// expect(stroke1.isDeleted).toBe(true);
```

- [ ] **Step 2: Run test to verify it fails correctly**

Run: `pnpm --filter core test`

- [ ] **Step 3: Implement IntersectionVisitor**

```typescript
export class IntersectionVisitor implements PageElementVisitor {
  // Logic to mark elements as is_deleted if they intersect the provided path
}
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add packages/core/
git commit -m "test(core): implement atomic erasure behavioral test and IntersectionVisitor (SC-S2)"
```

---

### Task 2: PDF Export Fidelity (Visual Regression)

**Files:**
- Create: `packages/core/tests/domain/Export.test.ts`

- [ ] **Step 1: Write snapshot test for PDF structure**

```typescript
it('should generate consistent PDF structure for a known page', () => {
  const page = setupSamplePage();
  const pdfOutput = PDFExporter.generate(page);
  expect(pdfOutput).toMatchSnapshot();
});
```

- [ ] **Step 2: Run test to verify it fails (missing exporter)**

- [ ] **Step 3: Implement minimal PDFExporter stub**

- [ ] **Step 4: Run test to verify snapshot is created/passed**

- [ ] **Step 5: Commit**

```bash
git add packages/core/
git commit -m "test(core): implement PDF export fidelity snapshot test"
```
