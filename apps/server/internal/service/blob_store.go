package service

import (
	"context"
	"io"
)

// BlobStore defines the interface for storing and retrieving binary data.
type BlobStore interface {
	Put(ctx context.Context, id string, data io.Reader) error
	Get(ctx context.Context, id string) (io.ReadCloser, error)
	Delete(ctx context.Context, id string) error
}
