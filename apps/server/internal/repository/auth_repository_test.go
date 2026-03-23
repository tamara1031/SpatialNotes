package repository_test

import (
	"context"
	"testing"
	"time"

	"github.com/tamara1031/spatial-notes/apps/server/internal/infrastructure"
	"github.com/tamara1031/spatial-notes/apps/server/internal/repository"
	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
)

func TestAuthRepositories(t *testing.T) {
	db, err := infrastructure.NewDB("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	ctx := context.Background()
	if err := infrastructure.CreateSchema(ctx, db); err != nil {
		t.Fatal(err)
	}

	userRepo := repository.NewUserRepository(db)
	authRepo := repository.NewAuthenticatorRepository(db)

	t.Run("Save and Find User", func(t *testing.T) {
		user := &service.User{
			ID:             "user-1",
			Email:          "test@example.com",
			DisplayName:    "Test User",
			SaltAuth:       "salt1",
			EncryptionSalt: "salt2",
			WrappedDEK:     "wrapped",
		}
		err = userRepo.Save(ctx, user)
		if err != nil {
			t.Fatal(err)
		}

		auth := &service.Authenticator{
			ID:         "auth-1",
			UserID:     "user-1",
			Type:       "password",
			Provider:   "local",
			Identifier: "test@example.com",
			Secret:     "hashed_token",
		}

		err = authRepo.Save(ctx, auth)
		if err != nil {
			t.Fatal(err)
		}

		// Verify
		saved, err := authRepo.FindByIdentifier(ctx, "local", "test@example.com")
		if err != nil {
			t.Fatal(err)
		}
		if saved.Secret != "hashed_token" {
			t.Errorf("expected secret hashed_token, got %s", saved.Secret)
		}
	})

	t.Run("Save and Find Authenticator", func(t *testing.T) {
		auth := &service.Authenticator{
			ID:         "a1",
			UserID:     "u1",
			Type:       "password",
			Provider:   "local",
			Identifier: "other@example.com",
			Secret:     "hashed_hash",
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}

		if err := authRepo.Save(ctx, auth); err != nil {
			t.Errorf("failed to save authenticator: %v", err)
		}

		saved, err := authRepo.FindByIdentifier(ctx, "local", "other@example.com")
		if err != nil {
			t.Errorf("failed to find authenticator: %v", err)
		}
		if saved.ID != "a1" || saved.Secret != "hashed_hash" {
			t.Errorf("expected authenticator a1, got %v", saved)
		}
	})
}
