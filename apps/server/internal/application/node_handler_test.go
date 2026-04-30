package application

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
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
	getNode     func(ctx context.Context, id string) (service.Node, error)
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
func (s *stubNodeService) GetNode(ctx context.Context, id string) (service.Node, error) {
	if s.getNode != nil {
		return s.getNode(ctx, id)
	}
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
	mux.HandleFunc("GET /api/nodes/{id}", h.HandleGet)
	mux.HandleFunc("PATCH /api/nodes/{id}", h.HandleMove)
	mux.HandleFunc("DELETE /api/nodes/{id}", h.HandleDelete)
	mux.HandleFunc("GET /api/search", h.HandleSearch)
	mux.HandleFunc("POST /api/nodes/{id}/updates", h.HandlePushUpdate)
	mux.HandleFunc("GET /api/nodes/{id}/updates", h.HandleGetUpdates)
	return mux
}

// --- HandleList ---

func TestHandleList_OK(t *testing.T) {
	node := service.NewFullNode("n1", service.NodeTypeNotebook, "", "u1", "", service.EncryptionStandard, nil, 0, false)
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
		Type:               service.NodeTypeNotebook,
		EncryptionStrategy: service.EncryptionStandard,
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

	body, _ := json.Marshal(UpsertNodeRequest{ID: "n1", Type: service.NodeTypeNotebook, EncryptionStrategy: service.EncryptionStandard})
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

	body, _ := json.Marshal(UpsertNodeRequest{ID: "n1", Type: service.NodeTypeNotebook, EncryptionStrategy: service.EncryptionStandard})
	req := authedRequest(http.MethodPost, "/api/nodes", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}
}

// TestHandleUpsert_ValidationError_Returns422 confirms that a service-layer
// ErrValidation (e.g. an unknown node type reaching the real NodeService)
// is correctly surfaced as HTTP 422 Unprocessable Entity rather than 400 or
// 500. The stub here mimics what the real service does when validateNode
// rejects a payload so that the handler→httperr path is pinned.
func TestHandleUpsert_ValidationError_Returns422(t *testing.T) {
	svc := &stubNodeService{
		saveNode: func(_ context.Context, _ service.Node) error {
			return service.ErrValidation
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	body, _ := json.Marshal(UpsertNodeRequest{
		ID:                 "n1",
		Type:               "UNKNOWN_TYPE",
		EncryptionStrategy: service.EncryptionStandard,
	})
	req := authedRequest(http.MethodPost, "/api/nodes", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422 on validation error, got %d", rr.Code)
	}
}

// TestHandleUpsert_EmptyID_Returns400 pins that a missing node id is rejected
// at the handler layer with 400, not at the service layer with 422. The
// distinction matters: missing id is malformed HTTP input (400 Bad Request),
// not a domain invariant violation (422 Unprocessable Entity). The service
// must not be called at all in this path.
func TestHandleUpsert_EmptyID_Returns400(t *testing.T) {
	var svcCalled bool
	svc := &stubNodeService{
		saveNode: func(_ context.Context, _ service.Node) error {
			svcCalled = true
			return nil
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	body, _ := json.Marshal(UpsertNodeRequest{
		Type:               service.NodeTypeNotebook,
		EncryptionStrategy: service.EncryptionStandard,
		// ID intentionally omitted
	})
	req := authedRequest(http.MethodPost, "/api/nodes", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing id, got %d", rr.Code)
	}
	if svcCalled {
		t.Error("service must not be called when id is missing")
	}
}

// TestHandleUpsert_WrappedValidationError_Returns422 verifies that a
// validation error wrapped with additional context (fmt.Errorf + %w) still
// maps to 422 — not 500 — so the errors.Is unwrapping in httperr.go is
// exercised through the full handler path.
func TestHandleUpsert_WrappedValidationError_Returns422(t *testing.T) {
	svc := &stubNodeService{
		saveNode: func(_ context.Context, _ service.Node) error {
			return fmt.Errorf("save_node: %w", service.ErrValidation)
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	body, _ := json.Marshal(UpsertNodeRequest{
		ID:                 "n1",
		Type:               service.NodeTypeChapter,
		EncryptionStrategy: service.EncryptionStandard,
	})
	req := authedRequest(http.MethodPost, "/api/nodes", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422 on wrapped validation error, got %d", rr.Code)
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
	if savedUpdate.CreatedAt == 0 {
		t.Errorf("expected CreatedAt to be set from wall clock, got 0")
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

// --- HandleMove ---

func TestHandleMove_OK(t *testing.T) {
	var capturedID, capturedParent string
	svc := &stubNodeService{
		moveNode: func(_ context.Context, id, newParentId string) error {
			capturedID = id
			capturedParent = newParentId
			return nil
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	body, _ := json.Marshal(MoveNodeRequest{ParentID: "new-parent"})
	req := authedRequest(http.MethodPatch, "/api/nodes/node-abc", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rr.Code)
	}
	if capturedID != "node-abc" {
		t.Errorf("expected id=node-abc, got %q", capturedID)
	}
	if capturedParent != "new-parent" {
		t.Errorf("expected newParentId=new-parent, got %q", capturedParent)
	}
}

func TestHandleMove_MissingID(t *testing.T) {
	svc := &stubNodeService{}
	h := NewNodeHandler(svc)

	body, _ := json.Marshal(MoveNodeRequest{ParentID: "p1"})
	req := authedRequest(http.MethodPatch, "/api/nodes//move", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	// Invoke handler directly without mux to simulate missing path param.
	h.HandleMove(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 on missing id, got %d", rr.Code)
	}
}

func TestHandleMove_InvalidBody(t *testing.T) {
	svc := &stubNodeService{}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	req := authedRequest(http.MethodPatch, "/api/nodes/node-abc", bytes.NewReader([]byte("not-json")))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 on invalid body, got %d", rr.Code)
	}
}

func TestHandleMove_CircularRef_Returns400(t *testing.T) {
	svc := &stubNodeService{
		moveNode: func(_ context.Context, _, _ string) error {
			return service.ErrCircularRef
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	body, _ := json.Marshal(MoveNodeRequest{ParentID: "descendant"})
	req := authedRequest(http.MethodPatch, "/api/nodes/node-abc", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 on circular ref, got %d", rr.Code)
	}
}

func TestHandleMove_Forbidden_Returns403(t *testing.T) {
	svc := &stubNodeService{
		moveNode: func(_ context.Context, _, _ string) error {
			return service.ErrForbidden
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	body, _ := json.Marshal(MoveNodeRequest{ParentID: "foreign-parent"})
	req := authedRequest(http.MethodPatch, "/api/nodes/node-abc", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 on forbidden move, got %d", rr.Code)
	}
}

func TestHandleMove_NodeNotFound_Returns404(t *testing.T) {
	svc := &stubNodeService{
		moveNode: func(_ context.Context, _, _ string) error {
			return service.ErrNodeNotFound
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	body, _ := json.Marshal(MoveNodeRequest{ParentID: "p1"})
	req := authedRequest(http.MethodPatch, "/api/nodes/ghost", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404 on node not found, got %d", rr.Code)
	}
}

func TestHandleMove_ServiceError_Returns500(t *testing.T) {
	svc := &stubNodeService{
		moveNode: func(_ context.Context, _, _ string) error {
			return errors.New("unexpected db failure")
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	body, _ := json.Marshal(MoveNodeRequest{ParentID: "p1"})
	req := authedRequest(http.MethodPatch, "/api/nodes/node-abc", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 on unexpected error, got %d", rr.Code)
	}
}

// --- HandleGet ---

func TestHandleGet_OK(t *testing.T) {
	node := service.NewFullNode("n1", service.NodeTypeNotebook, "root", "u1", "", service.EncryptionStandard, nil, 0, false)
	svc := &stubNodeService{
		getNode: func(_ context.Context, id string) (service.Node, error) {
			if id != "n1" {
				return nil, service.ErrNodeNotFound
			}
			return node, nil
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	req := authedRequest(http.MethodGet, "/api/nodes/n1", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if ct := rr.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", ct)
	}
	var got map[string]any
	if err := json.Unmarshal(rr.Body.Bytes(), &got); err != nil {
		t.Fatalf("body not valid JSON: %v — body: %s", err, rr.Body.String())
	}
	if got["id"] != "n1" {
		t.Errorf("expected id=n1 in response body, got %v", got["id"])
	}
}

func TestHandleGet_MissingID(t *testing.T) {
	svc := &stubNodeService{}
	h := NewNodeHandler(svc)

	req := authedRequest(http.MethodGet, "/api/nodes/", nil)
	rr := httptest.NewRecorder()
	// Call directly without mux to simulate missing path param.
	h.HandleGet(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 on missing id, got %d", rr.Code)
	}
}

func TestHandleGet_NotFound_Returns404(t *testing.T) {
	svc := &stubNodeService{
		getNode: func(_ context.Context, _ string) (service.Node, error) {
			return nil, service.ErrNodeNotFound
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	req := authedRequest(http.MethodGet, "/api/nodes/ghost", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}
}

func TestHandleGet_Unauthenticated_Returns401(t *testing.T) {
	svc := &stubNodeService{
		getNode: func(_ context.Context, _ string) (service.Node, error) {
			return nil, service.ErrUnauthenticated
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	// Deliberately unauthenticated request — no authctx.With on context.
	req := httptest.NewRequest(http.MethodGet, "/api/nodes/n1", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 on unauthenticated get, got %d", rr.Code)
	}
}

func TestHandleGet_Forbidden_Returns403(t *testing.T) {
	svc := &stubNodeService{
		getNode: func(_ context.Context, _ string) (service.Node, error) {
			return nil, service.ErrForbidden
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	req := authedRequest(http.MethodGet, "/api/nodes/foreign-node", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 on forbidden get, got %d", rr.Code)
	}
}

func TestHandleGet_ServiceError_Returns500(t *testing.T) {
	svc := &stubNodeService{
		getNode: func(_ context.Context, _ string) (service.Node, error) {
			return nil, errors.New("db connection lost")
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	req := authedRequest(http.MethodGet, "/api/nodes/n1", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 on unexpected error, got %d", rr.Code)
	}
}

// MoveNode accepts an empty parentId; that is a valid "move to root" signal
// (IsVirtualRoot treats "" as the tree root). The handler must not reject it.
func TestHandleMove_EmptyParentID_IsValid(t *testing.T) {
	var capturedParent string
	svc := &stubNodeService{
		moveNode: func(_ context.Context, _, newParentId string) error {
			capturedParent = newParentId
			return nil
		},
	}
	h := NewNodeHandler(svc)
	mux := newMux(h)

	body, _ := json.Marshal(MoveNodeRequest{ParentID: ""})
	req := authedRequest(http.MethodPatch, "/api/nodes/node-abc", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for empty parentId (move to root), got %d", rr.Code)
	}
	if capturedParent != "" {
		t.Errorf("expected capturedParent to be empty string, got %q", capturedParent)
	}
}
