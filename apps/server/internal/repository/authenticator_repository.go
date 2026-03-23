package repository

import (
	"context"
	"time"

	"github.com/tamara1031/spatial-notes/apps/server/internal/service"
	"github.com/uptrace/bun"
)

type Authenticator struct {
	bun.BaseModel `bun:"table:authenticators"`

	ID         string    `bun:"id,pk"`
	UserID     string    `bun:"user_id,notnull"`
	Type       string    `bun:"type,notnull"`
	Provider   string    `bun:"provider,notnull"`
	Identifier string    `bun:"identifier,notnull"`
	Secret     string    `bun:"secret"`
	CreatedAt  time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp"`
	UpdatedAt  time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp"`
}

type AuthenticatorRepository struct {
	db *bun.DB
}

func NewAuthenticatorRepository(db *bun.DB) *AuthenticatorRepository {
	return &AuthenticatorRepository{db: db}
}

func (r *AuthenticatorRepository) Save(ctx context.Context, auth *service.Authenticator) error {
	model := &Authenticator{
		ID:         auth.ID,
		UserID:     auth.UserID,
		Type:       auth.Type,
		Provider:   auth.Provider,
		Identifier: auth.Identifier,
		Secret:     auth.Secret,
		CreatedAt:  auth.CreatedAt,
		UpdatedAt:  auth.UpdatedAt,
	}
	if model.CreatedAt.IsZero() {
		model.CreatedAt = time.Now()
	}
	model.UpdatedAt = time.Now()

	_, err := r.db.NewInsert().Model(model).
		On("CONFLICT (id) DO UPDATE SET secret = EXCLUDED.secret, updated_at = EXCLUDED.updated_at").
		Exec(ctx)
	return err
}

func (r *AuthenticatorRepository) FindByIdentifier(ctx context.Context, provider, identifier string) (*service.Authenticator, error) {
	model := new(Authenticator)
	err := r.db.NewSelect().Model(model).
		Where("provider = ? AND identifier = ?", provider, identifier).
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	return r.toService(model), nil
}

func (r *AuthenticatorRepository) FindByUserID(ctx context.Context, userID string) ([]*service.Authenticator, error) {
	var models []Authenticator
	err := r.db.NewSelect().Model(&models).Where("user_id = ?", userID).Scan(ctx)
	if err != nil {
		return nil, err
	}

	results := make([]*service.Authenticator, len(models))
	for i, m := range models {
		results[i] = r.toService(&m)
	}
	return results, nil
}

func (r *AuthenticatorRepository) toService(m *Authenticator) *service.Authenticator {
	return &service.Authenticator{
		ID:         m.ID,
		UserID:     m.UserID,
		Type:       m.Type,
		Provider:   m.Provider,
		Identifier: m.Identifier,
		Secret:     m.Secret,
		CreatedAt:  m.CreatedAt,
		UpdatedAt:  m.UpdatedAt,
	}
}
