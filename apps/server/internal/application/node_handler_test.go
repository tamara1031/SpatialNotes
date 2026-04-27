package application

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
	"github.com/tamara1031/spatial-notes/apps/server/pkg/authctx"
)

// authedRequest builds an authenticated test request. Handlers expect an
// authenticated user id on the context (the production wire is
// AuthMiddleware, which writes via authctx.With); tests that exercise a
// happy path therefore have to mirror that contract or they end up
// testing the 401 branch by accident.
func authedRequest(method, target string, body io.Reader) *http.Request {
	req := httptest.NewRequest(method, target, body)
	return req.WithContext(authctx.With(req.Context(), "u1"))
}

// --- stub NodeService ---

type stubNodeService struct {
	searchNodes func(ctx context.Context, query string) ([]service.Node, error)
	saveNode    func(ctx context.Context, n service.Node) error
	moveNode    func(ctx context.Context, id, newParentId string) error
	deleteNode  func(ctx context.Context, id string) error
	saveUpdate  func(ctx context.Context, u *service.NodeUpdate) error
	getUpdates  func(ctx context.Context, nodeId string) ([]*service.NodeUpdate, error)
}

func (s *stubNodeService) SearchNodes(ctx context.Context, query string) ([]service.Node, error) {
	if s.searchNodes != nil {
		return s.searchNodes(ctx, query)
	}
	return nil, nil
}
func (s *stubNodeService) SaveNode(ctx context.Context, n service.Node) error {
	if s.saveNode != nil {
		return s.saveNode(ctx, n)
	}
	return nil
}
func (s *stubNodeService) MoveNode(ctx context.Context, id, newParentId string) error {
	if s.moveNode != nil {
		return s.moveNode(ctx, id, newParentId)
	}
	return nil
}
func (s *stubNodeService) GetNode(_ context.Context, _ string) (service.Node, error) {
	return nil, nil
}
func (s *stubNodeService) DeleteNode(ctx context.Context, id string) error {
	if s.deleteNode != nil {
		return s.deleteNode(ctx, id)
	}
	return nil
}
func (s *stubNodeService) SaveUpdate(ctx context.Context, u *service.NodeUpdate) error {
	if s.saveUpdate != nil {
		return s.saveUpdate(ctx, u)
	}
	return nil
}
func (s *stubNodeService) GetUpdates(ctx context.Context, nodeId string) ([]*service.NodeUpdate, error) {
	if s.getUpdates != nil {
		return s.getUpdates(ctx, nodeId)
	}
	return nil, nil
}

// --- helpers ---

func newMux(h *NodeHandler) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/nodes", h.HandleList)
	mux.HandleFunc("POST /api/nodes", h.HandleUpsert)
	mux.HandleFunc("PATCH /api/nodes/{id}", h.HandleMove)
	mux.HandleFunc("DELETE /api/nodes/{id}", h.HandleDelete)
	mux.HandleFunc("GET /api/search", h.HandleSearch)
	mux.HandleFunc("POST /api/nodes/{id}/updates", h.HandlePushUpdate)
	mux.HandleFunc("GET /api/nodes/{id}/updates", h.HandleGetUpdates)
	return mux
}

// --- HandleList ---

func TestHandleList_OK(t *testing.T) {
	node := service.NewFullNode("n1", "canvas", "", "u1", "", "standard", nil, 0, false)
	svc := &stubNodeService{
		searchNodes: func(_ context.Context, _ string) ([]service.Node, error) {
			return []service.Node{node}, nil
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if ct := rr.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", ct)
	}
	var got []map[string]any
	if err := json.Unmarshal(rr.Body.Bytes(), &got); err != nil {
		t.Fatalf("body not valid JSON: %v — body: %s", err, rr.Body.String())
	}
	if len(got) != 1 {
		t.Errorf("expected 1 node, got %d", len(got))
	}
}

func TestHandleList_ServiceError(t *testing.T) {
	svc := &stubNodeService{
		searchNodes: func(_ context.Context, _ string) ([]service.Node, error) {
			return nil, errors.New("db down")
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}
}

// --- HandleUpsert ---

func TestHandleUpsert_OK(t *testing.T) {
	svc := &stubNodeService{}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	body, _ := json.Marshal(UpsertNodeRequest{
		ID:                 "n1",
		Type:               "canvas",
		EncryptionStrategy: "standard",
	})
	req := authedRequest(http.MethodPost, "/api/nodes", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusAccepted {
		t.Fatalf("expected 202, got %d", rr.Code)
	}
}

func TestHandleUpsert_RejectsUnauthenticated(t *testing.T) {
	// HandleUpsert MUST refuse to construct a node when the request has no
	// authenticated user id on its context, because uid is the only proof
	// of ownership the service layer has. Pin this so a future "convenience"
	// regression that tolerates an empty uid (the previous silent-fail
	// behaviour) shows up here as a status mismatch.
	svc := &stubNodeService{}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	body, _ := json.Marshal(UpsertNodeRequest{ID: "n1", Type: "canvas"})
	req := httptest.NewRequest(http.MethodPost, "/api/nodes", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 on unauthenticated upsert, got %d", rr.Code)
	}
}

func TestHandleUpsert_InvalidBody(t *testing.T) {
	svc := &stubNodeService{}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	req := authedRequest(http.MethodPost, "/api/nodes", bytes.NewReader([]byte("not-json")))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestHandleUpsert_ServiceError(t *testing.T) {
	svc := &stubNodeService{
		saveNode: func(_ context.Context, _ service.Node) error {
			return errors.New("write failed")
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	body, _ := json.Marshal(UpsertNodeRequest{ID: "n1", Type: "canvas"})
	req := authedRequest(http.MethodPost, "/api/nodes", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}
}

// --- HandleDelete ---

func TestHandleDelete_OK(t *testing.T) {
	var deletedID string
	svc := &stubNodeService{
		deleteNode: func(_ context.Context, id string) error {
			deletedID = id
			return nil
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	req := httptest.NewRequest(http.MethodDelete, "/api/nodes/node-abc", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rr.Code)
	}
	if deletedID != "node-abc" {
		t.Errorf("expected deletedID=node-abc, got %q", deletedID)
	}
}

func TestHandleDelete_ServiceError(t *testing.T) {
	svc := &stubNodeService{
		deleteNode: func(_ context.Context, _ string) error {
			return errors.New("not found")
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	req := httptest.NewRequest(http.MethodDelete, "/api/nodes/node-abc", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}
}

// --- HandleSearch ---

func TestHandleSearch_OK(t *testing.T) {
	var capturedQuery string
	svc := &stubNodeService{
		searchNodes: func(_ context.Context, q string) ([]service.Node, error) {
			capturedQuery = q
			return []service.Node{}, nil
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	req := httptest.NewRequest(http.MethodGet, "/api/search?q=hello", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if capturedQuery != "hello" {
		t.Errorf("expected query=hello, got %q", capturedQuery)
	}
}

// --- HandleGetUpdates ---

func TestHandleGetUpdates_OK(t *testing.T) {
	updates := []*service.NodeUpdate{{NodeID: "n1", Payload: []byte("data")}}
	svc := &stubNodeService{
		getUpdates: func(_ context.Context, _ string) ([]*service.NodeUpdate, error) {
			return updates, nil
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	req := httptest.NewRequest(http.MethodGet, "/api/nodes/n1/updates", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if ct := rr.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", ct)
	}
}

func TestHandleGetUpdates_MissingID(t *testing.T) {
	svc := &stubNodeService{}
	h := NewNodeHandler(svc)

	// Call handler directly without going through mux to simulate missing id
	req := httptest.NewRequest(http.MethodGet, "/api/nodes//updates", nil)
	rr := httptest.NewRecorder()
	h.HandleGetUpdates(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

// --- HandlePushUpdate ---

func TestHandlePushUpdate_OK(t *testing.T) {
	var savedUpdate *service.NodeUpdate
	svc := &stubNodeService{
		saveUpdate: func(_ context.Context, u *service.NodeUpdate) error {
			savedUpdate = u
			return nil
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	body, _ := json.Marshal(PushUpdateRequest{Payload: []byte("patch-data")})
	req := authedRequest(http.MethodPost, "/api/nodes/n1/updates", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusAccepted {
		t.Fatalf("expected 202, got %d", rr.Code)
	}
	if savedUpdate == nil || savedUpdate.NodeID != "n1" {
		t.Errorf("expected nodeID=n1 in saved update, got %+v", savedUpdate)
	}
	if savedUpdate.UserID != "u1" {
		t.Errorf("expected userID=u1 from auth context, got %q", savedUpdate.UserID)
	}
}

func TestHandlePushUpdate_RejectsUnauthenticated(t *testing.T) {
	svc := &stubNodeService{}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	body, _ := json.Marshal(PushUpdateRequest{Payload: []byte("patch-data")})
	req := httptest.NewRequest(http.MethodPost, "/api/nodes/n1/updates", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 on unauthenticated push, got %d", rr.Code)
	}
}
