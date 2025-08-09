package database

import (
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq" // Postgres driver
	"time"
)

type UserData struct {
	AuthUserId string    `db:"authUserId"`
	CreatedAt  time.Time `db:"createdAt"`
	UpdatedAt  time.Time `db:"updatedAt"`
}

// InitDatabase initializes and returns a sqlx.DB connection to Postgres
func InitDatabase(connString string) (*sqlx.DB, error) {
	db, err := sqlx.Connect("postgres", connString)
	if err != nil {
		return nil, err
	}
	return db, nil
}

// GetOrCreateUser checks if a user exists by UID, creates if not
func GetOrCreateUser(db *sqlx.DB, uid string) (*UserData, error) {
	var user UserData
	err := db.Get(&user, "SELECT \"authUserId\", \"createdAt\", \"updatedAt\" FROM \"UserData\" WHERE \"authUserId\"=$1", uid)
	if err == nil {
		return &user, nil // User exists
	}
	// If not found, create
	now := time.Now()
	_, err = db.Exec("INSERT INTO \"UserData\" (\"authUserId\", \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3)", uid, now, now)
	if err != nil {
		return nil, err
	}
	user = UserData{AuthUserId: uid, CreatedAt: now, UpdatedAt: now}
	return &user, nil
}
