package repository

import (
	"time"

	"github.com/uptrace/bun"
)

type RoomUpdateModel struct {
	bun.BaseModel `bun:"table:room_updates"`
	ID            int64  `bun:"id,autoincrement,pk"`
	RoomID        string `bun:"room_id"`
	UpdateBlob    []byte `bun:"update_blob"`
	CreatedAt     int64  `bun:"created_at,notnull"`
}

func (m *RoomUpdateModel) BeforeInsert(db *bun.DB) error {
	m.CreatedAt = time.Now().Unix()
	return nil
}
