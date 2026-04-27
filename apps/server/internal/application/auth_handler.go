package application

import (
	"encoding/json"
	"net/http"

	"github.com/tamara1031/spatial-notes/apps/server/pkg/logger"
)

type AuthHandler struct {
	authSvc AuthService
}

func NewAuthHandler(authSvc AuthService) *AuthHandler {
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
	email := r.URL.Query().Get("email")
	logger.Info("Checking salts for email", "email", email)
	if email == "" {
		http.Error(w, "Missing email", http.StatusBadRequest)
		return
	}

	s1, s2, err := h.authSvc.GetSalts(r.Context(), email)
	if err != nil {
		logger.Info("Salts not found for email", "email", email)
		writeJSON(w, http.StatusOK, SaltResponse{Exists: false})
		return
	}

	logger.Info("Salts found for email", "email", email)
	writeJSON(w, http.StatusOK, SaltResponse{
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
		writeServiceError(w, err, "register_user", "email", req.Email)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"status": "ok", "token": token})
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
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	token, wrapped, err := h.authSvc.Login(r.Context(), req.Email, req.AuthToken)
	if err != nil {
		// Login intentionally bypasses writeServiceError. The mapper would
		// translate ErrUserNotFound into 404, which leaks whether an email
		// is registered. Login collapses every authentication failure into
		// the same 401 to deny that side channel.
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	writeJSON(w, http.StatusOK, LoginResponse{
		Status:     "ok",
		Token:      token,
		WrappedDEK: wrapped,
	})
}
