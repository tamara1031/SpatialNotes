package service

import (
	"encoding/json"
	"fmt"
)

// NodeType enumerates the kinds of nodes the service understands.
// Mirrors packages/core/src/domain/types.ts so that the wire format stays
// consistent across the Go server and the TypeScript clients.
type NodeType = string

const (
	NodeTypeChapter       NodeType = "CHAPTER"
	NodeTypeNotebook      NodeType = "NOTEBOOK"
	NodeTypeElementStroke NodeType = "ELEMENT_STROKE"
)

// EncryptionStrategy enumerates how node payloads are protected at rest.
type EncryptionStrategy = string

const (
	EncryptionStandard EncryptionStrategy = "STANDARD"
	EncryptionE2EE     EncryptionStrategy = "E2EE"
)

// virtualRootID is the conventional sentinel used as the parent_id of
// top-level structure nodes. It has no row in any repository — code that
// validates parent membership must treat it (and the empty string) as
// "the tree root" rather than "missing parent".
const virtualRootID = "root"

// IsVirtualRoot reports whether parentID denotes the conceptual top of
// the tree rather than a real persisted node. Use this to short-circuit
// existence/ownership checks against the structure repository.
func IsVirtualRoot(parentID string) bool {
	return parentID == "" || parentID == virtualRootID
}

// IsStructureType reports whether the given type belongs to the structural
// hierarchy (notebooks/chapters) rather than canvas elements. The service
// uses this to route a node to the correct repository.
func IsStructureType(t NodeType) bool {
	switch t {
	case NodeTypeChapter, NodeTypeNotebook:
		return true
	default:
		return false
	}
}

// validateNode is the single source of truth for "is this node
// structurally sound?". It is called by SaveNode before any authorization
// or repository interaction so that invalid inputs are rejected with a
// domain error rather than silently stored as garbage data.
func validateNode(n Node) error {
	if n.ID() == "" {
		return fmt.Errorf("%w: node id must not be empty", ErrValidation)
	}
	switch n.Type() {
	case NodeTypeChapter, NodeTypeNotebook, NodeTypeElementStroke:
		// valid
	default:
		return fmt.Errorf("%w: unknown node type %q", ErrValidation, n.Type())
	}
	switch n.EncryptionStrategy() {
	case EncryptionStandard, EncryptionE2EE:
		// valid
	default:
		return fmt.Errorf("%w: unknown encryption strategy %q", ErrValidation, n.EncryptionStrategy())
	}
	return nil
}

type Node interface {
	ID() string
	Type() string
	ParentID() string
	UserID() string
	EngineType() string
	EncryptionStrategy() string
	MetadataPayload() []byte
	UpdatedAt() int64
	IsDeleted() bool
}

type BaseNode struct {
	NodeId                 string `json:"id"`
	NodeType               string `json:"type"`
	ParentNodeId           string `json:"parent_id"`
	NodeUserID             string `json:"user_id"`
	NodeEngineType         string `json:"engine_type"`
	NodeEncryptionStrategy string `json:"encryption_strategy"`
	NodeMetadataPayload    []byte `json:"metadata_payload"`
	NodeUpdatedAt          int64  `json:"updated_at"`
	NodeDeleted            bool   `json:"is_deleted"`
}

func (n *BaseNode) ID() string                 { return n.NodeId }
func (n *BaseNode) Type() string               { return n.NodeType }
func (n *BaseNode) ParentID() string           { return n.ParentNodeId }
func (n *BaseNode) UserID() string             { return n.NodeUserID }
func (n *BaseNode) EngineType() string         { return n.NodeEngineType }
func (n *BaseNode) EncryptionStrategy() string { return n.NodeEncryptionStrategy }
func (n *BaseNode) MetadataPayload() []byte    { return n.NodeMetadataPayload }
func (n *BaseNode) UpdatedAt() int64           { return n.NodeUpdatedAt }
func (n *BaseNode) IsDeleted() bool            { return n.NodeDeleted }

func (n *BaseNode) MarshalJSON() ([]byte, error) {
	type Alias BaseNode
	return json.Marshal(&struct {
		*Alias
		Type string `json:"type"`
	}{
		Alias: (*Alias)(n),
		Type:  n.NodeType,
	})
}

func NewBaseNode(id, nodeType, parentId, userId string) Node {
	return &BaseNode{
		NodeId:                 id,
		NodeType:               nodeType,
		ParentNodeId:           parentId,
		NodeUserID:             userId,
		NodeEncryptionStrategy: EncryptionStandard,
	}
}

func NewFullNode(id, nodeType, parentId, userId, engineType, strategy string, metadataPayload []byte, updatedAt int64, isDeleted bool) Node {
	return &BaseNode{
		NodeId:                 id,
		NodeType:               nodeType,
		ParentNodeId:           parentId,
		NodeUserID:             userId,
		NodeEngineType:         engineType,
		NodeEncryptionStrategy: strategy,
		NodeMetadataPayload:    metadataPayload,
		NodeUpdatedAt:          updatedAt,
		NodeDeleted:            isDeleted,
	}
}

type NodeUpdate struct {
	NodeID    string `json:"nodeId"`
	UserID    string `json:"userId"`
	Payload   []byte `json:"payload"`
	CreatedAt int64  `json:"createdAt"`
}
