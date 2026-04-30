package service

import (
	"context"
	"strings"
)

type FakeStructureRepository struct {
	nodes       map[string]Node
	elementRepo *FakeElementRepository
	// searchErr, when non-nil, is returned by every Search call.
	searchErr error
	// findErr, when non-nil, is returned by every FindByID call instead of
	// the normal lookup — used to simulate infrastructure failures.
	findErr error
	// treeErr, when non-nil, is returned by every GetTree call — used to
	// simulate infrastructure failures during delete/move operations.
	treeErr error
}

func NewFakeStructureRepository() *FakeStructureRepository {
	return &FakeStructureRepository{nodes: make(map[string]Node)}
}

func (f *FakeStructureRepository) SetExternalRepos(e *FakeElementRepository) {
	f.elementRepo = e
}

func (f *FakeStructureRepository) Save(ctx context.Context, n Node) error {
	f.nodes[n.ID()] = n
	return nil
}

func (f *FakeStructureRepository) FindByID(ctx context.Context, id, userID string) (Node, error) {
	if f.findErr != nil {
		return nil, f.findErr
	}
	n, ok := f.nodes[id]
	if !ok || n.UserID() != userID {
		return nil, ErrNodeNotFound
	}
	return n, nil
}

func (f *FakeStructureRepository) GetTree(ctx context.Context, rootId, userID string) ([]Node, error) {
	if f.treeErr != nil {
		return nil, f.treeErr
	}
	root, ok := f.nodes[rootId]
	if !ok || root.UserID() != userID {
		return nil, ErrNodeNotFound
	}

	var results []Node
	queue := []string{rootId}
	visited := make(map[string]bool)
	visited[rootId] = true
	results = append(results, root)

	for len(queue) > 0 {
		curr := queue[0]
		queue = queue[1:]

		// Check structure
		for _, n := range f.nodes {
			if n.ParentID() == curr && n.UserID() == userID && !visited[n.ID()] {
				visited[n.ID()] = true
				results = append(results, n)
				queue = append(queue, n.ID())
			}
		}
		// Check elements
		if f.elementRepo != nil {
			for _, n := range f.elementRepo.elements {
				if n.ParentID() == curr && n.UserID() == userID && !visited[n.ID()] {
					visited[n.ID()] = true
					results = append(results, n)
					queue = append(queue, n.ID())
				}
			}
		}
	}
	return results, nil
}

func (f *FakeStructureRepository) Delete(ctx context.Context, id, userID string) error {
	n, ok := f.nodes[id]
	if ok && n.UserID() == userID {
		delete(f.nodes, id)
	}
	return nil
}

func (f *FakeStructureRepository) DeleteMany(ctx context.Context, ids []string, userID string) error {
	for _, id := range ids {
		if err := f.Delete(ctx, id, userID); err != nil {
			return err
		}
	}
	return nil
}

// Search mirrors the repository contract: return all non-deleted nodes owned
// by userID, optionally narrowed to those whose Type contains query
// (case-insensitive), consistent with the `type LIKE` SQL implementation.
// If searchErr is set it is returned immediately to simulate infrastructure
// failures.
func (f *FakeStructureRepository) Search(ctx context.Context, query, userID string) ([]Node, error) {
	if f.searchErr != nil {
		return nil, f.searchErr
	}
	var results []Node
	q := strings.ToUpper(query)
	for _, n := range f.nodes {
		if n.UserID() != userID || n.IsDeleted() {
			continue
		}
		if q == "" || strings.Contains(strings.ToUpper(n.Type()), q) {
			results = append(results, n)
		}
	}
	return results, nil
}

type FakeElementRepository struct {
	elements map[string]Node
}

func NewFakeElementRepository() *FakeElementRepository {
	return &FakeElementRepository{elements: make(map[string]Node)}
}

func (f *FakeElementRepository) Save(ctx context.Context, n Node) error {
	f.elements[n.ID()] = n
	return nil
}

func (f *FakeElementRepository) FindByID(ctx context.Context, id, userID string) (Node, error) {
	n, ok := f.elements[id]
	if !ok || n.UserID() != userID {
		return nil, ErrNodeNotFound
	}
	return n, nil
}

func (f *FakeElementRepository) Delete(ctx context.Context, id, userID string) error {
	n, ok := f.elements[id]
	if ok && n.UserID() == userID {
		delete(f.elements, id)
	}
	return nil
}

func (f *FakeElementRepository) DeleteMany(ctx context.Context, ids []string, userID string) error {
	for _, id := range ids {
		if err := f.Delete(ctx, id, userID); err != nil {
			return err
		}
	}
	return nil
}

func (f *FakeElementRepository) DeleteByNodeID(ctx context.Context, nodeId, userID string) error {
	for id, n := range f.elements {
		if n.ParentID() == nodeId && n.UserID() == userID {
			delete(f.elements, id)
		}
	}
	return nil
}

var (
	_ StructureRepository = (*FakeStructureRepository)(nil)
	_ ElementRepository   = (*FakeElementRepository)(nil)
)

type FakeNodeUpdateRepository struct {
	updates map[string][]*NodeUpdate
}

func NewFakeNodeUpdateRepository() *FakeNodeUpdateRepository {
	return &FakeNodeUpdateRepository{updates: make(map[string][]*NodeUpdate)}
}

func (f *FakeNodeUpdateRepository) Save(ctx context.Context, u *NodeUpdate) error {
	f.updates[u.NodeID] = append(f.updates[u.NodeID], u)
	return nil
}

func (f *FakeNodeUpdateRepository) FindAllByNodeID(ctx context.Context, nodeId, userID string) ([]*NodeUpdate, error) {
	all := f.updates[nodeId]
	var results []*NodeUpdate
	for _, u := range all {
		if u.UserID == userID {
			results = append(results, u)
		}
	}
	return results, nil
}

var _ NodeUpdateRepository = (*FakeNodeUpdateRepository)(nil)

// FakeTransactor satisfies the Transactor contract for unit tests.
//
// Two modes:
//  1. Normal (failAfter == 0): fn receives a FakeCombinedNodeWriter that
//     delegates writes to the underlying fake repos, so tests that inspect
//     repo state after a DeleteNode call continue to work correctly.
//  2. Failure simulation (failAfter > 0): fn receives a FakeNodeWriter that
//     returns ErrInternal on the Nth call without touching any repo, letting
//     atomicity tests assert that no partial state leaked.
type FakeTransactor struct {
	structure *FakeStructureRepository
	element   *FakeElementRepository
	failAfter int
}

// NewFakeTransactor returns a transactor whose writer is a no-op combined
// writer (suitable for tests that don't exercise the transactional delete path).
func NewFakeTransactor() *FakeTransactor { return &FakeTransactor{} }

// NewFakeTransactorWithRepos returns a transactor that routes NodeWriter calls
// to the provided fake repos — mirrors how NodeTransactor binds a
// NodeRepository to a bun.Tx that targets the same notebook_nodes table.
func NewFakeTransactorWithRepos(structure *FakeStructureRepository, element *FakeElementRepository) *FakeTransactor {
	return &FakeTransactor{structure: structure, element: element}
}

func (t *FakeTransactor) RunInTx(ctx context.Context, fn func(ctx context.Context, w NodeWriter) error) error {
	if t.failAfter > 0 {
		return fn(ctx, &FakeNodeWriter{failAfter: t.failAfter})
	}
	return fn(ctx, &FakeCombinedNodeWriter{structure: t.structure, element: t.element})
}

// FakeCombinedNodeWriter routes NodeWriter calls to the underlying fake repos,
// mirroring the real NodeRepository that uses a single notebook_nodes table for
// both structure and element nodes.
type FakeCombinedNodeWriter struct {
	structure *FakeStructureRepository
	element   *FakeElementRepository
}

func (w *FakeCombinedNodeWriter) Save(ctx context.Context, n Node) error {
	if w.structure == nil {
		return nil
	}
	if IsStructureType(n.Type()) {
		return w.structure.Save(ctx, n)
	}
	if w.element != nil {
		return w.element.Save(ctx, n)
	}
	return nil
}

func (w *FakeCombinedNodeWriter) DeleteMany(ctx context.Context, ids []string, userID string) error {
	if w.structure == nil {
		return nil
	}
	// Real NodeRepository uses one table for both node kinds; the combined
	// writer tries both repos so tests don't need to pre-classify IDs.
	if err := w.structure.DeleteMany(ctx, ids, userID); err != nil {
		return err
	}
	if w.element != nil {
		return w.element.DeleteMany(ctx, ids, userID)
	}
	return nil
}

func (w *FakeCombinedNodeWriter) DeleteByNodeID(ctx context.Context, nodeID, userID string) error {
	if w.element == nil {
		return nil
	}
	return w.element.DeleteByNodeID(ctx, nodeID, userID)
}

// FakeNodeWriter records every write call and returns ErrInternal once
// callCount reaches failAfter (when failAfter > 0). It intentionally does
// NOT touch the fake repos — that is the point: callers that check state
// after a simulated failure should find the repos unchanged.
type FakeNodeWriter struct {
	callCount int
	failAfter int
	// savedNodes and deletedIDs capture calls that succeeded before failure,
	// so atomicity tests can assert that no partial state was applied.
	savedNodes []Node
	deletedIDs []string
}

func (w *FakeNodeWriter) tickOrFail() error {
	w.callCount++
	if w.failAfter > 0 && w.callCount >= w.failAfter {
		return ErrInternal
	}
	return nil
}

func (w *FakeNodeWriter) Save(_ context.Context, n Node) error {
	if err := w.tickOrFail(); err != nil {
		return err
	}
	w.savedNodes = append(w.savedNodes, n)
	return nil
}

func (w *FakeNodeWriter) DeleteMany(_ context.Context, ids []string, _ string) error {
	if err := w.tickOrFail(); err != nil {
		return err
	}
	w.deletedIDs = append(w.deletedIDs, ids...)
	return nil
}

func (w *FakeNodeWriter) DeleteByNodeID(_ context.Context, nodeID, _ string) error {
	if err := w.tickOrFail(); err != nil {
		return err
	}
	w.deletedIDs = append(w.deletedIDs, nodeID)
	return nil
}

var _ Transactor = (*FakeTransactor)(nil)
var _ NodeWriter = (*FakeNodeWriter)(nil)
