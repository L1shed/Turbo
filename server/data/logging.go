package data

import (
	"encoding/csv"
	"math"
	"os"
	"server/database"
	"strconv"
	"time"
)

type ConnectionFeatures struct {
	Protocol  string
	StartTime time.Time
	Inbound   map[int64]uint16 // 16-bit because max buffer size is 4096
	Outbound  map[int64]uint16
}

func LogConnection(features *ConnectionFeatures) {
	if features == nil {
		return
	}
	if len(features.Inbound) == 0 && len(features.Outbound) == 0 {
		return
	}

	f, err := os.OpenFile(".logs/dataset.csv", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()

	writer := csv.NewWriter(f)
	defer writer.Flush()

	inboundPackets := len(features.Inbound)
	outboundPackets := len(features.Outbound)
	inoutRatio := float32(inboundPackets / outboundPackets)
	totalPackets := inboundPackets + outboundPackets
	inboundBytes := uint16(0)
	inboundTimes := make([]int64, 0, inboundPackets)
	outboundBytes := uint16(0)
	outboundTimes := make([]int64, 0, outboundPackets)

	for timemicro, bytes := range features.Inbound {
		inboundBytes += bytes
		inboundTimes = append(inboundTimes, timemicro)
	}

	for timemicro, bytes := range features.Outbound {
		outboundBytes += bytes
		outboundTimes = append(outboundTimes, timemicro)
	}

	totalBytes := inboundBytes + outboundBytes

	mergedTimes := make([]int64, 0, len(inboundTimes)+len(outboundTimes))
	i, j := 0, 0
	for i < len(inboundTimes) && j < len(outboundTimes) {
		if inboundTimes[i] < outboundTimes[j] {
			mergedTimes = append(mergedTimes, inboundTimes[i])
			i++
		} else {
			mergedTimes = append(mergedTimes, outboundTimes[j])
			j++
		}
	}
	for ; i < len(inboundTimes); i++ {
		mergedTimes = append(mergedTimes, inboundTimes[i])
	}
	for ; j < len(outboundTimes); j++ {
		mergedTimes = append(mergedTimes, outboundTimes[j])
	}

	var meanInterArrival float64
	var minInterArrival int64
	var maxInterArrival int64
	var stdInterArrival float64
	if len(mergedTimes) > 1 {
		intervals := make([]int64, 0, len(mergedTimes)-1)
		for i := 1; i < len(mergedTimes); i++ {
			interval := mergedTimes[i] - mergedTimes[i-1]
			intervals = append(intervals, interval)
		}

		minInterArrival = intervals[0]
		maxInterArrival = intervals[0]
		sum := int64(0)
		for _, interval := range intervals {
			if interval < minInterArrival {
				minInterArrival = interval
			}
			if interval > maxInterArrival {
				maxInterArrival = interval
			}
			sum += interval
		}

		meanInterArrival = float64(sum) / float64(len(intervals))

		variance := 0.0
		for _, interval := range intervals {
			diff := float64(interval) - meanInterArrival
			variance += diff * diff
		}
		variance /= float64(len(intervals))
		stdInterArrival = math.Sqrt(variance)
	}

	meanPktSize := float64(totalBytes) / float64(totalPackets)
	var minPktSize uint16
	var maxPktSize uint16
	var stdPktSize float64
	maxPktSize = 0
	sumPktSize := float64(0)
	for _, bytes := range features.Inbound {
		if bytes < minPktSize {
			minPktSize = bytes
		}
		if bytes > maxPktSize {
			maxPktSize = bytes
		}
		sumPktSize += float64(bytes)
	}
	for _, bytes := range features.Outbound {
		if bytes < minPktSize {
			minPktSize = bytes
		}
		if bytes > maxPktSize {
			maxPktSize = bytes
		}
		sumPktSize += float64(bytes)
	}
	stdPktSize = math.Sqrt(sumPktSize/float64(totalPackets) - meanPktSize*meanPktSize)

	duration := mergedTimes[len(mergedTimes)-1]

	var throughputMbps float64
	if len(mergedTimes) > 0 {
		durationSeconds := float64(duration) / 1_000_000
		if durationSeconds > 0 {
			throughputMbps = (float64(totalBytes) * 8) / (durationSeconds * 1_000_000) // convert bytes to bits, then to Mbps
		}
	}

	data := map[string]string{
		"protocol":           features.Protocol,
		"start_time":         features.StartTime.Format(time.RFC3339),
		"inbound_packets":    strconv.Itoa(inboundPackets),
		"outbound_packets":   strconv.Itoa(outboundPackets),
		"inout_ratio":        strconv.FormatFloat(float64(inoutRatio), 'f', -1, 64),
		"total_packets":      strconv.Itoa(totalPackets),
		"inbound_bytes":      strconv.FormatUint(uint64(inboundBytes), 10),
		"outbound_bytes":     strconv.FormatUint(uint64(outboundBytes), 10),
		"total_bytes":        strconv.FormatUint(uint64(totalBytes), 10),
		"mean_inter_arrival": strconv.FormatFloat(meanInterArrival, 'f', -1, 64),
		"min_inter_arrival":  strconv.FormatInt(minInterArrival, 10),
		"max_inter_arrival":  strconv.FormatInt(maxInterArrival, 10),
		"std_inter_arrival":  strconv.FormatFloat(stdInterArrival, 'f', -1, 64),
		"mean_pkt_size":      strconv.FormatFloat(meanPktSize, 'f', -1, 64),
		"min_pkt_size":       strconv.FormatUint(uint64(minPktSize), 10),
		"max_pkt_size":       strconv.FormatUint(uint64(maxPktSize), 10),
		"std_pkt_size":       strconv.FormatFloat(stdPktSize, 'f', -1, 64),
		"duration":           strconv.FormatInt(duration, 10),
		"throughput_mbps":    strconv.FormatFloat(throughputMbps, 'f', -1, 64),
	}
	database.PublishFeatures(data)

	var row []string
	for _, value := range data {
		row = append(row, value)
	}

	err = writer.Write(row)
	if err != nil {
		return
	}
}
