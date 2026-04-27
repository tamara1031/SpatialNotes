package application

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
	"github.com/tamara1031/spatial-notes/apps/server/pkg/authctx"
)

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
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	nodes, err := h.service.SearchNodes(r.Context(), "")
	if err != nil {
		writeServiceError(w, err, "list_nodes")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nodes)
}

func (h *NodeHandler) HandleUpsert(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	uid, ok := authctx.UserID(r.Context())
	if !ok {
		writeServiceError(w, service.ErrUnauthenticated, "save_node")
		return
	}
	var req UpsertNodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
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
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Simple URL path parsing: /api/nodes/{id}
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 || parts[3] == "" {
		http.Error(w, "Missing node id", http.StatusBadRequest)
		return
	}
	id := parts[3]

	if err := h.service.DeleteNode(r.Context(), id); err != nil {
		writeServiceError(w, err, "delete_node", "id", id)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *NodeHandler) HandleSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := r.URL.Query().Get("q")
	nodes, err := h.service.SearchNodes(r.Context(), query)
	if err != nil {
		writeServiceError(w, err, "search_nodes", "query", query)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nodes)
}

func (h *NodeHandler) HandlePushUpdate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	uid, ok := authctx.UserID(r.Context())
	if !ok {
		writeServiceError(w, service.ErrUnauthenticated, "push_update")
		return
	}
	id := r.PathValue("id")
	if id == "" {
		parts := strings.Split(r.URL.Path, "/")
		if len(parts) < 4 || parts[3] == "" {
			http.Error(w, "Missing node id", http.StatusBadRequest)
			return
		}
		id = parts[3]
	}

	var req PushUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
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
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		parts := strings.Split(r.URL.Path, "/")
		if len(parts) < 4 || parts[3] == "" {
			http.Error(w, "Missing node id", http.StatusBadRequest)
			return
		}
		id = parts[3]
	}

	updates, err := h.service.GetUpdates(r.Context(), id)
	if err != nil {
		writeServiceError(w, err, "get_updates", "nodeId", id)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updates)
}
