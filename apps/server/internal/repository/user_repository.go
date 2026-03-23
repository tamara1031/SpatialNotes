package repository

import (
	"context"
	"time"

	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
	"github.com/uptrace/bun"
)

type User struct {
	bun.BaseModel `bun:"table:users"`

	ID             string    `bun:"id,pk"`
	Email          string    `bun:"email,unique,notnull"`
	DisplayName    string    `bun:"display_name"`
	SaltAuth       string    `bun:"salt_auth,notnull"`
	EncryptionSalt string    `bun:"encryption_salt,notnull"`
	WrappedDEK     string    `bun:"wrapped_dek,notnull"`
	CreatedAt      time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp"`
	UpdatedAt      time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp"`
}

type UserRepository struct {
	db *bun.DB
}

func NewUserRepository(db *bun.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Save(ctx context.Context, user *service.User) error {
	model := &User{
		ID:             user.ID,
		Email:          user.Email,
		DisplayName:    user.DisplayName,
		SaltAuth:       user.SaltAuth,
		EncryptionSalt: user.EncryptionSalt,
		WrappedDEK:     user.WrappedDEK,
		CreatedAt:      user.CreatedAt,
		UpdatedAt:      user.UpdatedAt,
	}
	if model.CreatedAt.IsZero() {
		model.CreatedAt = time.Now()
	}
	model.UpdatedAt = time.Now()

	_, err := r.db.NewInsert().Model(model).
		On("CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name, salt_auth = EXCLUDED.salt_auth, encryption_salt = EXCLUDED.encryption_salt, wrapped_dek = EXCLUDED.wrapped_dek, updated_at = EXCLUDED.updated_at").
		Exec(ctx)
	return err
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*service.User, error) {
	model := new(User)
	err := r.db.NewSelect().Model(model).Where("email = ?", email).Scan(ctx)
	if err != nil {
		return nil, err
	}

	return r.toService(model), nil
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*service.User, error) {
	model := new(User)
	err := r.db.NewSelect().Model(model).Where("id = ?", id).Scan(ctx)
	if err != nil {
		return nil, err
	}

	return r.toService(model), nil
}

// GetFirstUser is used for the single-user architecture to check if ANY user exists.
func (r *UserRepository) GetFirstUser(ctx context.Context) (*service.User, error) {
	model := new(User)
	err := r.db.NewSelect().Model(model).Order("id ASC").Limit(1).Scan(ctx)
	if err != nil {
		return nil, err
	}

	return r.toService(model), nil
}

func (r *UserRepository) toService(m *User) *service.User {
	return &service.User{
		ID:             m.ID,
		Email:          m.Email,
		DisplayName:    m.DisplayName,
		SaltAuth:       m.SaltAuth,
		EncryptionSalt: m.EncryptionSalt,
		WrappedDEK:     m.WrappedDEK,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
}
