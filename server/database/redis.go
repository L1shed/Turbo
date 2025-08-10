package database

import (
	"context"
	"errors"
	"fmt"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"os"
)

var (
	rdb *redis.Client
	ctx = context.Background()
)

func InitRedis() {
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	rdb = redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})
}

func RegisterUser(user, password string, credits int) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("error hashing password: %v", err)
	}

	rdb.HSet(ctx, "user:"+user, "password", hashedPassword, "credits", credits)

	return nil
}

func GetCredits(user, password string) (int, error) {
	storedHash, err := rdb.HGet(ctx, "user:"+user, "password").Result()

	err2 := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password))

	if err != nil || err2 != nil {
		if errors.Is(err, redis.Nil) {
			return 0, fmt.Errorf("user does not exist")
		} else if err != nil {
			return 0, fmt.Errorf("error retrieving user: %v", err)
		} else {
			return 0, fmt.Errorf("invalid password")
		}
	}

	credits, err := rdb.HGet(ctx, "user:"+user, "credits").Int()

	if err != nil {
		if errors.Is(err, redis.Nil) {
			return 0, fmt.Errorf("user does not exist")
		} else {
			return 0, fmt.Errorf("error retrieving credits: %v", err)
		}
	}

	return credits, nil
}
