package common

const RatePerGb = 0.01

func calculate_reward(bytes uint64) float64 {
	gb := bytes / 1_000_000
	rate := float64(gb) * RatePerGb
	return rate
}
