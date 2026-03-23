# Test Specification: UC6 Node Lifecycle

## Objective
Verify the correctness, efficiency, and safety of Node Rename and Recursive Delete operations.

## Test Cases

### TC-UC6-1: Successful Rename
- **Precondition**: A node exists.
- **Action**: Call `RenameNodeUseCase` with a valid new name.
- **Expected Result**:
    - Node name is updated in the repository.
    - `NodeRenamed` event is published.
    - `SyncService` triggers `UpdateNodeCommand`.

### TC-UC6-2: Successful Recursive Delete
- **Precondition**: A folder (Chapter) exists with multiple child notebooks and elements.
- **Action**: Call `DeleteNodeUseCase` for the folder.
- **Expected Result**:
    - The folder and ALL its descendants are marked as `isDeleted`.
    - `SubtreeDeletionService` is used for efficient identification of descendants.
    - `NodeDeleted` events are published for each deleted node.
    - `SyncService` triggers `DeleteElementCommand` (or equivalent) for each.

### TC-UC6-3: Authorization for Delete
- **Precondition**: Node belongs to User A.
- **Action**: User B attempts to delete the node.
- **Expected Result**:
    - Operation fails with "Unauthorized".
    - No nodes are marked as deleted.

### TC-UC6-4: Empty Name Validation (Rename)
- **Precondition**: A node exists.
- **Action**: Call `RenameNodeUseCase` with an empty string.
- **Expected Result**:
    - Operation fails with "Name cannot be empty".
    - Node name remains unchanged.

### TC-UC6-5: Performance (Recursive Delete)
- **Precondition**: A large tree (e.g., 100+ nodes) exists.
- **Action**: Call `DeleteNodeUseCase` for the root.
- **Expected Result**:
    - Operation completes without timeout.
    - Repository calls are minimized (batched if possible).
