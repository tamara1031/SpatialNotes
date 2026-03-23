package storage

import (
	"bytes"
	"context"
	"io"
	"os"
	"testing"
)

func TestLocalFileBlobStore_PutGet(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "blobstore-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tempDir)

	store := NewLocalFileBlobStore(tempDir)
	ctx := context.Background()
	data := []byte("hello spatial notes")
	id := "test-id"

	if err := store.Put(ctx, id, bytes.NewReader(data)); err != nil {
		t.Fatalf("Put failed: %v", err)
	}

	rc, err := store.Get(ctx, id)
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	defer rc.Close()

	buf, err := io.ReadAll(rc)
	if err != nil {
		t.Fatal(err)
	}

	if !bytes.Equal(buf, data) {
		t.Errorf("Expected %s, got %s", string(data), string(buf))
	}
}
