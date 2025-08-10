package database

import (
	"encoding/base64"
	"github.com/redis/go-redis/v9"
)

func PublishFeatures(featuresJSON []byte) {
	_ = rdb.XAdd(ctx,
		&redis.XAddArgs{
			Stream: "connections",
			Values: map[string]interface{}{
				"data": base64.StdEncoding.EncodeToString(featuresJSON),
			},
		},
	).Err()

	return
}
