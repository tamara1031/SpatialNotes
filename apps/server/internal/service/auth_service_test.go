package service_test

import (
	"context"
	"testing"

	"github.com/tamara1031/spatial-notes/apps/server/internal/infrastructure"
	"github.com/tamara1031/spatial-notes/apps/server/internal/repository"
	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
)

func TestAuthService(t *testing.T) {
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
	authSvc := service.NewAuthService(userRepo, authRepo, "secret")

	t.Run("GetSalts and Register", func(t *testing.T) {
		_, _, err := authSvc.GetSalts(ctx, "test@example.com")
		if err == nil {
			t.Fatal("should fail for non-existent user")
		}

		token, err := authSvc.Register(ctx, "test@example.com", "salt_auth", "salt_enc", "wrapped_dek", "auth_token")
		if err != nil {
			t.Fatalf("failed to register: %v", err)
		}
		if token == "" {
			t.Fatal("should return token")
		}

		s1, s2, err := authSvc.GetSalts(ctx, "test@example.com")
		if err != nil || s1 != "salt_auth" || s2 != "salt_enc" {
			t.Fatalf("failed to get salts: %v", err)
		}
	})

	t.Run("Login", func(t *testing.T) {
		token, wrapped, err := authSvc.Login(ctx, "test@example.com", "auth_token")
		if err != nil {
			t.Fatalf("failed to login: %v", err)
		}
		if token == "" {
			t.Fatal("should return token on login")
		}
		if wrapped != "wrapped_dek" {
			t.Errorf("expected wrapped_dek, got %s", wrapped)
		}

		_, _, err = authSvc.Login(ctx, "test@example.com", "wrong_token")
		if err == nil {
			t.Fatal("should fail with wrong token")
		}
	})
}
