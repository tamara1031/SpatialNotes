package service

import (
	"encoding/json"
)

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
		NodeEncryptionStrategy: "STANDARD",
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
