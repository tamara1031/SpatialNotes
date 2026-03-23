package service

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrInvalidToken      = errors.New("invalid token")
	ErrUnauthorized      = errors.New("unauthorized")
)

type User struct {
	ID             string    `json:"id"`
	Email          string    `json:"email"`
	DisplayName    string    `json:"displayName"`
	SaltAuth       string    `json:"saltAuth"`
	EncryptionSalt string    `json:"encryptionSalt"`
	WrappedDEK     string    `json:"wrappedDEK"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type Authenticator struct {
	ID         string    `json:"id"`
	UserID     string    `json:"userId"`
	Type       string    `json:"type"`       // 'password', 'oidc'
	Provider   string    `json:"provider"`   // 'local', 'google'
	Identifier string    `json:"identifier"` // email or sub
	Secret     string    `json:"-"`          // hashed auth_hash
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

type UserRepository interface {
	Save(ctx context.Context, user *User) error
	FindByEmail(ctx context.Context, email string) (*User, error)
	FindByID(ctx context.Context, id string) (*User, error)
	GetFirstUser(ctx context.Context) (*User, error)
}

type AuthenticatorRepository interface {
	Save(ctx context.Context, auth *Authenticator) error
	FindByIdentifier(ctx context.Context, provider, identifier string) (*Authenticator, error)
	FindByUserID(ctx context.Context, userID string) ([]*Authenticator, error)
}

type AuthService struct {
	userRepo  UserRepository
	authRepo  AuthenticatorRepository
	jwtSecret []byte
}

func NewAuthService(userRepo UserRepository, authRepo AuthenticatorRepository, secret string) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		authRepo:  authRepo,
		jwtSecret: []byte(secret),
	}
}

func (s *AuthService) GetSalts(ctx context.Context, email string) (string, string, error) {
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return "", "", ErrUserNotFound
	}
	return user.SaltAuth, user.EncryptionSalt, nil
}

func (s *AuthService) Register(ctx context.Context, email, saltAuth, saltEncryption, wrappedDEK, authToken string) (string, error) {
	existing, _ := s.userRepo.FindByEmail(ctx, email)
	if existing != nil {
		return "", ErrUserAlreadyExists
	}

	// 1. Hash Auth Token for storage
	hashedAuthToken, err := bcrypt.GenerateFromPassword([]byte(authToken), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	userID := uuid.New().String()
	user := &User{
		ID:             userID,
		Email:          email,
		DisplayName:    "User",
		SaltAuth:       saltAuth,
		EncryptionSalt: saltEncryption,
		WrappedDEK:     wrappedDEK,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.userRepo.Save(ctx, user); err != nil {
		return "", err
	}

	auth := &Authenticator{
		ID:         uuid.New().String(),
		UserID:     userID,
		Type:       "password",
		Provider:   "local",
		Identifier: email,
		Secret:     string(hashedAuthToken),
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := s.authRepo.Save(ctx, auth); err != nil {
		return "", err
	}

	return s.GenerateToken(user.ID)
}

func (s *AuthService) Login(ctx context.Context, email, authToken string) (string, string, error) {
	auth, err := s.authRepo.FindByIdentifier(ctx, "local", email)
	if err != nil || auth == nil {
		return "", "", ErrUnauthorized
	}

	// Verify Auth Token with Bcrypt
	err = bcrypt.CompareHashAndPassword([]byte(auth.Secret), []byte(authToken))
	if err != nil {
		return "", "", ErrUnauthorized
	}

	user, err := s.userRepo.FindByID(ctx, auth.UserID)
	if err != nil {
		return "", "", ErrUserNotFound
	}

	token, err := s.GenerateToken(auth.UserID)
	if err != nil {
		return "", "", err
	}

	return token, user.WrappedDEK, nil
}

func (s *AuthService) GenerateToken(userID string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(time.Hour * 24).Unix(),
		"iat": time.Now().Unix(),
	})

	return token.SignedString(s.jwtSecret)
}

func (s *AuthService) ValidateToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return s.jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return "", ErrInvalidToken
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", ErrInvalidToken
	}

	userID, ok := claims["sub"].(string)
	if !ok {
		return "", ErrInvalidToken
	}

	return userID, nil
}
