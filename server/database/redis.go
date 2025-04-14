package database

import (
	"github.com/redis/go-redis/v9"
	"os"
)

var (
	Rdb *redis.Client
)

func InitRedis() {
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	Rdb = redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})
}
