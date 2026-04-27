package application

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
)

// --- stub AuthService ---

type stubAuthService struct {
	getSalts func(ctx context.Context, email string) (string, string, error)
	register func(ctx context.Context, email, saltAuth, saltEncryption, wrappedDEK, authToken string) (string, error)
	login    func(ctx context.Context, email, authToken string) (string, string, error)
}

func (s *stubAuthService) GetSalts(ctx context.Context, email string) (string, string, error) {
	if s.getSalts != nil {
		return s.getSalts(ctx, email)
	}
	return "", "", errors.New("not found")
}

func (s *stubAuthService) Register(ctx context.Context, email, saltAuth, saltEncryption, wrappedDEK, authToken string) (string, error) {
	if s.register != nil {
		return s.register(ctx, email, saltAuth, saltEncryption, wrappedDEK, authToken)
	}
	return "token-abc", nil
}

func (s *stubAuthService) Login(ctx context.Context, email, authToken string) (string, string, error) {
	if s.login != nil {
		return s.login(ctx, email, authToken)
	}
	return "token-abc", "dek-abc", nil
}

// --- HandleGetSalt ---

func TestHandleGetSalt_UserNotFound(t *testing.T) {
	svc := &stubAuthService{
		getSalts: func(_ context.Context, _ string) (string, string, error) {
			return "", "", errors.New("not found")
		},
	}
	h := NewAuthHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/auth/salt/?email=user@example.com", nil)
	rr := httptest.NewRecorder()
	h.HandleGetSalt(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	var resp SaltResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("body not valid JSON: %v", err)
	}
	if resp.Exists {
		t.Error("expected Exists=false for unknown user")
	}
}

func TestHandleGetSalt_UserFound(t *testing.T) {
	svc := &stubAuthService{
		getSalts: func(_ context.Context, _ string) (string, string, error) {
			return "salt-auth", "salt-enc", nil
		},
	}
	h := NewAuthHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/auth/salt/?email=user@example.com", nil)
	rr := httptest.NewRecorder()
	h.HandleGetSalt(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if ct := rr.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", ct)
	}
	var resp SaltResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("body not valid JSON: %v", err)
	}
	if !resp.Exists || resp.SaltAuth != "salt-auth" || resp.EncryptionSalt != "salt-enc" {
		t.Errorf("unexpected response: %+v", resp)
	}
}

func TestHandleGetSalt_MissingEmail(t *testing.T) {
	h := NewAuthHandler(&stubAuthService{})

	req := httptest.NewRequest(http.MethodGet, "/api/auth/salt/", nil)
	rr := httptest.NewRecorder()
	h.HandleGetSalt(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

// --- HandleRegister ---

func TestHandleRegister_OK(t *testing.T) {
	svc := &stubAuthService{
		register: func(_ context.Context, _, _, _, _, _ string) (string, error) {
			return "jwt-token", nil
		},
	}
	h := NewAuthHandler(svc)

	body, _ := json.Marshal(RegisterRequest{
		Email:          "user@example.com",
		SaltAuth:       "sa",
		EncryptionSalt: "se",
		WrappedDEK:     "dek",
		AuthToken:      "at",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/register/", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	h.HandleRegister(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rr.Code)
	}
	var resp map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("body not valid JSON: %v", err)
	}
	if resp["status"] != "ok" || resp["token"] != "jwt-token" {
		t.Errorf("unexpected response: %+v", resp)
	}
}

func TestHandleRegister_UserAlreadyExists(t *testing.T) {
	svc := &stubAuthService{
		register: func(_ context.Context, _, _, _, _, _ string) (string, error) {
			return "", service.ErrUserAlreadyExists
		},
	}
	h := NewAuthHandler(svc)

	body, _ := json.Marshal(RegisterRequest{
		Email: "user@example.com", SaltAuth: "s", EncryptionSalt: "e", WrappedDEK: "d", AuthToken: "a",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/register/", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	h.HandleRegister(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d", rr.Code)
	}
}

func TestHandleRegister_MissingFields(t *testing.T) {
	h := NewAuthHandler(&stubAuthService{})

	body, _ := json.Marshal(RegisterRequest{Email: "user@example.com"})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/register/", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	h.HandleRegister(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

// --- HandleLogin ---

func TestHandleLogin_OK(t *testing.T) {
	svc := &stubAuthService{
		login: func(_ context.Context, _, _ string) (string, string, error) {
			return "jwt-token", "wrapped-dek", nil
		},
	}
	h := NewAuthHandler(svc)

	body, _ := json.Marshal(LoginRequest{Email: "user@example.com", AuthToken: "at"})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login/", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	h.HandleLogin(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	var resp LoginResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("body not valid JSON: %v", err)
	}
	if resp.Token != "jwt-token" || resp.WrappedDEK != "wrapped-dek" {
		t.Errorf("unexpected response: %+v", resp)
	}
}

func TestHandleLogin_Unauthorized(t *testing.T) {
	svc := &stubAuthService{
		login: func(_ context.Context, _, _ string) (string, string, error) {
			return "", "", service.ErrUnauthorized
		},
	}
	h := NewAuthHandler(svc)

	body, _ := json.Marshal(LoginRequest{Email: "user@example.com", AuthToken: "wrong"})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login/", bytes.NewReader(body))
	rr := httptest.NewRecorder()
	h.HandleLogin(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}
