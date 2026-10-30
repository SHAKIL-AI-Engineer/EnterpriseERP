package zkteco

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/canhlinh/gozk"
	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/processor"
	"github.com/enterprise-erp/punchdata/internal/timeutil"
)

const defaultTimeout = 30 * time.Second

type Client struct {
	timezone string
	timeout  time.Duration
}

type ConnectionResult struct {
	Connected    bool       `json:"connected"`
	CheckedAt    time.Time  `json:"checkedAt"`
	DeviceID     string     `json:"deviceId,omitempty"`
	Firmware     string     `json:"firmware,omitempty"`
	DeviceClock  *time.Time `json:"deviceClock,omitempty"`
	TotalRecords int        `json:"totalRecords"`
	TotalUsers   int        `json:"totalUsers"`
}

type SyncFetch struct {
	Records    []processor.RawPunch `json:"records"`
	Properties *ConnectionResult    `json:"properties,omitempty"`
}

// AttendanceFetch is the result of a successful LAN attendance download.
type AttendanceFetch struct {
	SyncFetch *SyncFetch
	UseTCP    bool
}

func NewClient(timezone string, timeout time.Duration) *Client {
	if timezone == "" {
		timezone = timeutil.DefaultTimezone
	}
	if timeout <= 0 {
		timeout = defaultTimeout
	}
	return &Client{timezone: timezone, timeout: timeout}
}

func isRWBNotSupported(err error) bool {
	return err != nil && strings.Contains(strings.ToLower(err.Error()), "rwb not supported")
}

func (c *Client) TestConnection(ctx context.Context, machine models.PunchMachine) (*ConnectionResult, error) {
	result, err := c.testConnectionOnce(ctx, machine)
	if err == nil || !isRWBNotSupported(err) {
		return result, err
	}
	alt := machine
	alt.UseTCP = !machine.UseTCP
	return c.testConnectionOnce(ctx, alt)
}

func (c *Client) testConnectionOnce(ctx context.Context, machine models.PunchMachine) (*ConnectionResult, error) {
	zk := c.newZK(machine)
	if err := call(ctx, c.timeout, zk.Connect); err != nil {
		return nil, err
	}
	defer zk.Disconnect()

	props, err := callValue(ctx, c.timeout, zk.GetProperties)
	if err != nil {
		return nil, err
	}
	return resultFromProperties(props), nil
}

func (c *Client) FetchAttendance(ctx context.Context, machine models.PunchMachine) (*AttendanceFetch, error) {
	// F18/K40 devices usually need UDP first; always try UDP then TCP.
	udp := machine
	udp.UseTCP = false
	tcp := machine
	tcp.UseTCP = true
	candidates := []models.PunchMachine{udp, tcp}

	var lastErr error
	for _, candidate := range candidates {
		fetch, err := c.fetchAttendanceOnce(ctx, candidate)
		if err == nil {
			return &AttendanceFetch{SyncFetch: fetch, UseTCP: candidate.UseTCP}, nil
		}
		lastErr = err
		if !isRWBNotSupported(err) {
			break
		}
	}

	if lastErr == nil {
		lastErr = fmt.Errorf("attendance download failed")
	}
	return nil, fmt.Errorf("%w (tried UDP=%v and TCP=%v; device must allow buffer read while paused)", lastErr, !machine.UseTCP, machine.UseTCP)
}

func (c *Client) fetchAttendanceOnce(ctx context.Context, machine models.PunchMachine) (*SyncFetch, error) {
	zk := c.newZK(machine)
	if err := call(ctx, c.timeout, zk.Connect); err != nil {
		return nil, err
	}
	defer zk.Disconnect()

	// ZKTeco devices require "disable" before bulk attendance read (see gozk tests).
	defer func() { _ = call(ctx, c.timeout, zk.EnableDevice) }()
	_ = call(ctx, c.timeout, zk.DisableDevice)

	props, _ := callValue(ctx, c.timeout, zk.GetProperties)
	events, err := callValue(ctx, c.timeout, zk.GetAllScannedEvents)
	if err != nil {
		return nil, err
	}

	deviceID := machine.DeviceID()
	rows := make([]processor.RawPunch, 0, len(events))
	for _, ev := range events {
		if ev == nil || ev.Error != nil {
			continue
		}
		eventDeviceID := ev.DeviceID
		if eventDeviceID == "" {
			eventDeviceID = deviceID
		}
		rows = append(rows, processor.RawPunch{
			PunchNumber: strconv.FormatInt(ev.UserID, 10),
			DeviceID:    eventDeviceID,
			PunchTime:   timeutil.FormatPunchTime(ev.Timestamp),
			Source:      "ZKTeco",
			CompanyID:   &machine.CompanyID,
		})
	}

	return &SyncFetch{
		Records:    rows,
		Properties: resultFromProperties(props),
	}, nil
}

func (c *Client) newZK(machine models.PunchMachine) *gozk.ZK {
	opts := []gozk.Option{
		gozk.WithPort(machine.Port),
		gozk.WithTCP(machine.UseTCP),
		gozk.WithTimezone(c.timezone),
		gozk.WithDeviceID(machine.DeviceID()),
	}
	pin := 0
	if machine.Password != nil {
		pin = *machine.Password
	}
	opts = append(opts, gozk.WithPin(pin))
	return gozk.NewZK(machine.IPAddress, opts...)
}

func withTimeout(ctx context.Context, timeout time.Duration) (context.Context, context.CancelFunc) {
	if _, ok := ctx.Deadline(); ok {
		return ctx, func() {}
	}
	return context.WithTimeout(ctx, timeout)
}

func call(ctx context.Context, timeout time.Duration, fn func() error) error {
	runCtx, cancel := withTimeout(ctx, timeout)
	defer cancel()

	done := make(chan error, 1)
	go func() { done <- fn() }()

	select {
	case err := <-done:
		return err
	case <-runCtx.Done():
		return fmt.Errorf("zkteco operation timed out: %w", runCtx.Err())
	}
}

func callValue[T any](ctx context.Context, timeout time.Duration, fn func() (T, error)) (T, error) {
	runCtx, cancel := withTimeout(ctx, timeout)
	defer cancel()

	type result struct {
		value T
		err   error
	}
	done := make(chan result, 1)
	go func() {
		value, err := fn()
		done <- result{value: value, err: err}
	}()

	select {
	case res := <-done:
		return res.value, res.err
	case <-runCtx.Done():
		var zero T
		return zero, fmt.Errorf("zkteco operation timed out: %w", runCtx.Err())
	}
}

func resultFromProperties(props *gozk.ZKProperties) *ConnectionResult {
	now := timeutil.Now()
	if props == nil {
		return &ConnectionResult{Connected: true, CheckedAt: now}
	}
	clock := timeutil.InDhaka(props.Clock)
	return &ConnectionResult{
		Connected:    true,
		CheckedAt:    now,
		DeviceID:     props.ID,
		Firmware:     props.Version,
		DeviceClock:  &clock,
		TotalRecords: props.TotalRecords,
		TotalUsers:   props.TotalUsers,
	}
}
