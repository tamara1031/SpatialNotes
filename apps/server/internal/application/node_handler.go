package application

import (
	"net/http"

	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
	"github.com/tamara1031/spatial-notes/apps/server/pkg/authctx"
)

// requireNodeID extracts the {id} path parameter and writes a 400 to w
// when the route did not capture one. Every node handler that operates on
// a single node uses this so the missing-id contract is enforced in
// exactly one place; the previous mix of r.PathValue and a manual
// strings.Split fallback hid silent regressions whenever a route
// definition drifted from its handler's expectations.
func requireNodeID(w http.ResponseWriter, r *http.Request) (string, bool) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Missing node id", http.StatusBadRequest)
		return "", false
	}
	return id, true
}

// requireUserID returns the authenticated user id attached to r's context
// by AuthMiddleware. When no uid is present (the middleware was bypassed
// or a test forgot authctx.With), it writes the canonical 401 response
// for the named operation and returns false; the caller should return.
//
// Centralising this means the "uid -> 401 via ErrUnauthenticated" path is
// expressed once instead of being copy-pasted at every endpoint that
// stamps a uid onto an outbound payload.
func requireUserID(w http.ResponseWriter, r *http.Request, op string) (string, bool) {
	uid, ok := authctx.UserID(r.Context())
	if !ok {
		writeServiceError(w, service.ErrUnauthenticated, op)
		return "", false
	}
	return uid, true
}

type NodeHandler struct {
	service NodeService
}

func NewNodeHandler(service NodeService) *NodeHandler {
	return &NodeHandler{service: service}
}

type UpsertNodeRequest struct {
	ID                 string `json:"id"`
	Type               string `json:"type"`
	ParentID           string `json:"parentId"`
	EngineType         string `json:"engineType"`
	EncryptionStrategy string `json:"encryptionStrategy"`
	MetadataPayload    []byte `json:"metadataPayload"`
	UpdatedAt          int64  `json:"updatedAt"`
	IsDeleted          bool   `json:"isDeleted"`
}

type PushUpdateRequest struct {
	Payload []byte `json:"payload"`
}

func (h *NodeHandler) HandleList(w http.ResponseWriter, r *http.Request) {
	nodes, err := h.service.SearchNodes(r.Context(), "")
	if err != nil {
		writeServiceError(w, err, "list_nodes")
		return
	}

	writeJSON(w, http.StatusOK, nodes)
}

func (h *NodeHandler) HandleUpsert(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r, "save_node")
	if !ok {
		return
	}
	var req UpsertNodeRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	node := service.NewFullNode(
		req.ID,
		req.Type,
		req.ParentID,
		uid,
		req.EngineType,
		req.EncryptionStrategy,
		req.MetadataPayload,
		req.UpdatedAt,
		req.IsDeleted,
	)

	if err := h.service.SaveNode(r.Context(), node); err != nil {
		writeServiceError(w, err, "save_node", "id", req.ID)
		return
	}

	w.WriteHeader(http.StatusAccepted)
}

func (h *NodeHandler) HandleDelete(w http.ResponseWriter, r *http.Request) {
	id, ok := requireNodeID(w, r)
	if !ok {
		return
	}

	if err := h.service.DeleteNode(r.Context(), id); err != nil {
		writeServiceError(w, err, "delete_node", "id", id)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *NodeHandler) HandleSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	nodes, err := h.service.SearchNodes(r.Context(), query)
	if err != nil {
		writeServiceError(w, err, "search_nodes", "query", query)
		return
	}

	writeJSON(w, http.StatusOK, nodes)
}

func (h *NodeHandler) HandlePushUpdate(w http.ResponseWriter, r *http.Request) {
	uid, ok := requireUserID(w, r, "push_update")
	if !ok {
		return
	}
	id, ok := requireNodeID(w, r)
	if !ok {
		return
	}

	var req PushUpdateRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	update := &service.NodeUpdate{
		NodeID:  id,
		UserID:  uid,
		Payload: req.Payload,
	}

	if err := h.service.SaveUpdate(r.Context(), update); err != nil {
		writeServiceError(w, err, "push_update", "nodeId", id)
		return
	}

	w.WriteHeader(http.StatusAccepted)
}

func (h *NodeHandler) HandleGetUpdates(w http.ResponseWriter, r *http.Request) {
	id, ok := requireNodeID(w, r)
	if !ok {
		return
	}

	updates, err := h.service.GetUpdates(r.Context(), id)
	if err != nil {
		writeServiceError(w, err, "get_updates", "nodeId", id)
		return
	}

	writeJSON(w, http.StatusOK, updates)
}
