package service

import (
	"context"
	"strings"
)

type FakeStructureRepository struct {
	nodes       map[string]Node
	elementRepo *FakeElementRepository
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
	n, ok := f.nodes[id]
	if !ok || n.UserID() != userID {
		return nil, ErrNodeNotFound
	}
	return n, nil
}

func (f *FakeStructureRepository) GetTree(ctx context.Context, rootId, userID string) ([]Node, error) {
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
func (f *FakeStructureRepository) Search(ctx context.Context, query, userID string) ([]Node, error) {
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
