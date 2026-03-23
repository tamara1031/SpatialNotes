# Test Specification: Engine Performance and Worker Latency

## 1. Objective
To ensure that the off-main-thread rendering architecture (ADR-041) satisfies the latency budgets defined in ADR-035 (sub-16ms per interaction frame) and maintains robust communication via the `WorkerBridge`.

## 2. Test Scenarios

### 2.1 WorkerBridge Reliability (White-box)
- **ID**: TS-WB-01
- **Target**: `WorkerBridge.ts`
- **Method**: Unit test with mocked `Worker`.
- **Verification**: 
  - Each request gets a unique incrementing ID.
  - The promise resolves ONLY when a message with matching ID is received.
  - Concurrent requests do not cross-talk IDs.

### 2.2 Interaction Latency (Black-box/Benchmarking)
- **ID**: TS-WB-02
- **Target**: `CanvasEngine` + `WorkerBridge`.
- **Method**: Measure time from `pointerDown` to `WorkerBridge` resolution.
- **Verification**: 
  - Average latency for `POINTER_MOVE` should be < 5ms (excluding rendering).
  - Jitter (99th percentile) should be < 10ms.

### 2.3 Zero-Copy Buffer Access
- **ID**: TS-WB-03
- **Target**: `CanvasWorker` + WASM Memory.
- **Method**: Verify `Float64Array` view creation.
- **Verification**: 
  - Pointer retrieval from WASM.
  - Direct reading of coordinates without JSON parsing.

### 2.4 Visual Stability (Coordinate Consistency)
- **ID**: TS-VS-01
- **Target**: `CanvasEngine` + `PredictiveRenderer`.
- **Method**: Compare coordinates of predicted stroke vs finalized stroke.
- **Verification**: 
  - Difference between predicted points and final smooth paths MUST NOT exceed 1px jump.
  - No layout shift when transitioning from prediction to final object.

## 3. Tooling
- **Vitest**: For unit and integration tests.
- **Performance API**: `performance.now()` for high-resolution timing.
