package models

import (
	"fmt"
	"strconv"
	"strings"
)

// ParsePunchNumber parses a badge / punch number (positive integer).
func ParsePunchNumber(raw string) (int, error) {
	s := strings.TrimSpace(raw)
	if s == "" {
		return 0, fmt.Errorf("punch number is required")
	}
	n, err := strconv.Atoi(s)
	if err != nil || n <= 0 {
		return 0, fmt.Errorf("punch number must be a positive integer")
	}
	return n, nil
}
