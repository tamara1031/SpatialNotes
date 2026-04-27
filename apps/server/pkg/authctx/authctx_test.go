package authctx_test

import (
	"context"
	"testing"

	"github.com/tamara1031/spatial-notes/apps/server/pkg/authctx"
)

func TestUserID_RoundTrip(t *testing.T) {
	ctx := authctx.With(context.Background(), "u1")
	got, ok := authctx.UserID(ctx)
	if !ok || got != "u1" {
		t.Fatalf("With/UserID round-trip failed: got=%q ok=%v", got, ok)
	}
}

func TestUserID_AbsentReturnsFalse(t *testing.T) {
	if _, ok := authctx.UserID(context.Background()); ok {
		t.Errorf("expected ok=false on bare context")
	}
}

func TestUserID_EmptyStringTreatedAsAbsent(t *testing.T) {
	// An empty user id is structurally indistinguishable from a missing
	// authentication and must therefore signal "absent" so service layer
	// guards (which translate this to ErrUnauthenticated) cannot be
	// fooled by middleware that forgot to populate the value.
	ctx := authctx.With(context.Background(), "")
	if _, ok := authctx.UserID(ctx); ok {
		t.Errorf("expected ok=false when stored uid is empty")
	}
}
