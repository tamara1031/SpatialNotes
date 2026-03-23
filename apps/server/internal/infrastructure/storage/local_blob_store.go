package storage

import (
	"context"
	"io"
	"os"
	"path/filepath"

	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
)

type LocalFileBlobStore struct {
	baseDir string
}

func NewLocalFileBlobStore(baseDir string) *LocalFileBlobStore {
	return &LocalFileBlobStore{baseDir: baseDir}
}

func (s *LocalFileBlobStore) Put(ctx context.Context, id string, data io.Reader) error {
	path := filepath.Join(s.baseDir, id)
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}

	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = io.Copy(f, data)
	return err
}

func (s *LocalFileBlobStore) Get(ctx context.Context, id string) (io.ReadCloser, error) {
	path := filepath.Join(s.baseDir, id)
	return os.Open(path)
}

func (s *LocalFileBlobStore) Delete(ctx context.Context, id string) error {
	path := filepath.Join(s.baseDir, id)
	return os.Remove(path)
}

// Ensure LocalFileBlobStore implements BlobStore
var _ service.BlobStore = (*LocalFileBlobStore)(nil)
