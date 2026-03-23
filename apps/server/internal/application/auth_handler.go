package application

import (
	"encoding/json"
	"net/http"

	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
	"github.com/tamara1031/spatial-notes/apps/server/pkg/logger"
)

type AuthHandler struct {
	authSvc *service.AuthService
}

func NewAuthHandler(authSvc *service.AuthService) *AuthHandler {
	return &AuthHandler{
		authSvc: authSvc,
	}
}

type SaltResponse struct {
	Exists         bool   `json:"exists"`
	SaltAuth       string `json:"salt_auth,omitempty"`
	EncryptionSalt string `json:"encryption_salt,omitempty"`
}

func (h *AuthHandler) HandleGetSalt(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	email := r.URL.Query().Get("email")
	logger.Info("Checking salts for email", "email", email)
	if email == "" {
		http.Error(w, "Missing email", http.StatusBadRequest)
		return
	}

	s1, s2, err := h.authSvc.GetSalts(r.Context(), email)
	if err != nil {
		logger.Info("Salts not found for email", "email", email)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(SaltResponse{Exists: false})
		return
	}

	logger.Info("Salts found for email", "email", email)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(SaltResponse{
		Exists:         true,
		SaltAuth:       s1,
		EncryptionSalt: s2,
	})
}

type RegisterRequest struct {
	Email          string `json:"email"`
	SaltAuth       string `json:"salt_auth"`
	EncryptionSalt string `json:"encryption_salt"`
	WrappedDEK     string `json:"wrapped_dek"`
	AuthToken      string `json:"auth_token"`
}

func (h *AuthHandler) HandleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.SaltAuth == "" || req.EncryptionSalt == "" || req.WrappedDEK == "" || req.AuthToken == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	token, err := h.authSvc.Register(r.Context(), req.Email, req.SaltAuth, req.EncryptionSalt, req.WrappedDEK, req.AuthToken)
	if err != nil {
		if err == service.ErrUserAlreadyExists {
			http.Error(w, "User already exists", http.StatusConflict)
		} else {
			logger.Error("Failed to register user", "error", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "token": token})
}

type LoginRequest struct {
	Email     string `json:"email"`
	AuthToken string `json:"auth_token"`
}

type LoginResponse struct {
	Status     string `json:"status"`
	Token      string `json:"token"`
	WrappedDEK string `json:"wrapped_dek"`
}

func (h *AuthHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	token, wrapped, err := h.authSvc.Login(r.Context(), req.Email, req.AuthToken)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(LoginResponse{
		Status:     "ok",
		Token:      token,
		WrappedDEK: wrapped,
	})
}
