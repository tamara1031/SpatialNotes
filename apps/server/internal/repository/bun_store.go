package repository

import (
	"github.com/uptrace/bun"
)

type BunStore struct {
	db *bun.DB
}

func NewBunStore(db *bun.DB) *BunStore {
	return &BunStore{db: db}
}

func (s *BunStore) DB() *bun.DB {
	return s.db
}
