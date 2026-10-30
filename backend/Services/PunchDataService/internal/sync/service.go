package sync



import (

	"context"

	"encoding/json"

	"fmt"

	"strings"

	"time"



	"github.com/enterprise-erp/punchdata/internal/collector"

	"github.com/enterprise-erp/punchdata/internal/devices/zkteco"

	"github.com/enterprise-erp/punchdata/internal/models"

	"github.com/enterprise-erp/punchdata/internal/processor"

	"github.com/enterprise-erp/punchdata/internal/repository"

	"github.com/enterprise-erp/punchdata/internal/timeutil"

	"github.com/google/uuid"

)



type Service struct {

	repo                 *repository.Repository

	proc                 *processor.Service

	zk                   *zkteco.Client

	remote               *collector.RemoteService

	remoteLookbackDays   int

}



type Result struct {

	History    *models.DeviceSyncHistory `json:"history"`

	LogFile    *models.PunchLogFile       `json:"logFile,omitempty"`

	Process    *processor.Result          `json:"process,omitempty"`

	Connection *zkteco.ConnectionResult   `json:"connection,omitempty"`

}



func NewService(repo *repository.Repository, proc *processor.Service, zk *zkteco.Client) *Service {

	return &Service{repo: repo, proc: proc, zk: zk, remoteLookbackDays: 7}

}



func NewServiceWithRemote(

	repo *repository.Repository,

	proc *processor.Service,

	zk *zkteco.Client,

	remote *collector.RemoteService,

	remoteLookbackDays int,

) *Service {

	if remoteLookbackDays <= 0 {

		remoteLookbackDays = 7

	}

	return &Service{

		repo:               repo,

		proc:               proc,

		zk:                 zk,

		remote:             remote,

		remoteLookbackDays: remoteLookbackDays,

	}

}



// SyncMachine connects to the device, downloads attendance, deduplicates, saves new logs,

// publishes PunchLogCollected for each new row, updates LastSyncedAt, and writes DeviceSyncHistories.

// When LAN download fails with RWB and remote SQL is configured, falls back to read-only remote CHECKINOUT import.

func (s *Service) SyncMachine(ctx context.Context, machine models.PunchMachine, triggerType string) (*Result, error) {

	return s.SyncMachineOptions(ctx, machine, triggerType, false)

}



func (s *Service) SyncMachineOptions(ctx context.Context, machine models.PunchMachine, triggerType string, forceRemote bool) (*Result, error) {

	if !machine.IsActive {

		return nil, fmt.Errorf("machine is inactive")

	}



	started := timeutil.Now()

	history := &models.DeviceSyncHistory{

		ID:            uuid.New(),

		CompanyID:     machine.CompanyID,

		MachineID:     machine.ID,

		TriggerType:   triggerType,

		Status:        models.SyncStatusFailed,

		SyncStartedAt: started,

	}

	if err := s.repo.CreateDeviceSyncHistory(ctx, history); err != nil {

		return nil, err

	}



	finish := func(status string, stats repository.SyncHistoryStats, logFileID *uuid.UUID, err error) (*Result, error) {

		var msg *string

		if err != nil {

			m := trimErr(err)

			msg = &m

		}

		_ = s.repo.CompleteDeviceSyncHistory(ctx, history.ID, status, stats, logFileID, msg)

		if status == models.SyncStatusSuccess {

			_ = s.repo.UpdatePunchMachineSync(ctx, machine.ID, timeutil.Now(), stats.NewLogs, nil)

			_ = s.repo.UpdatePunchMachineConnection(ctx, machine.ID, models.MachineStatusConnected, ptrTime(timeutil.Now()), nil)

		} else if err != nil {

			_ = s.repo.UpdatePunchMachineConnection(ctx, machine.ID, models.MachineStatusDisconnected, nil, msg)

		}

		if fresh, loadErr := s.repo.GetDeviceSyncHistory(ctx, history.ID); loadErr == nil {

			history = fresh

		}

		return &Result{History: history}, err

	}



	if forceRemote {

		if s.remote == nil {

			return finish(models.SyncStatusFailed, repository.SyncHistoryStats{}, nil, fmt.Errorf("remote ZKTeco SQL collect is not configured"))

		}

		return s.syncViaRemote(ctx, machine, history, started, finish)

	}



	if _, err := s.zk.TestConnection(ctx, machine); err != nil {

		return finish(models.SyncStatusFailed, repository.SyncHistoryStats{}, nil, err)

	}



	attendance, err := s.zk.FetchAttendance(ctx, machine)

	if err != nil {

		if s.remote != nil && isRWBError(err) {

			return s.syncViaRemote(ctx, machine, history, started, finish)

		}

		return finish(models.SyncStatusFailed, repository.SyncHistoryStats{}, nil, err)

	}

	if attendance.UseTCP != machine.UseTCP {

		machine.UseTCP = attendance.UseTCP

		_ = s.repo.UpsertPunchMachine(ctx, &machine)

	}

	fetch := attendance.SyncFetch



	total := len(fetch.Records)

	if total == 0 {

		return finish(models.SyncStatusSuccess, repository.SyncHistoryStats{}, nil, nil)

	}



	batch := processor.BatchPayload{

		CompanyID: &machine.CompanyID,

		DeviceID:  machine.DeviceID(),

		Source:    "ZKTeco",

		Records:   fetch.Records,

	}

	payload, err := json.Marshal(batch)

	if err != nil {

		return finish(models.SyncStatusFailed, repository.SyncHistoryStats{TotalLogs: total}, nil, err)

	}



	lf := &models.PunchLogFile{

		ID:          uuid.New(),

		FileName:    fmt.Sprintf("zkteco-%s-%s.json", machine.DeviceCode, started.Format("20060102T150405Z")),

		SourceType:  "ZKTecoSync",

		ContentType: "application/json",

		DeviceID:    machine.DeviceID(),

		CompanyID:   machine.CompanyID,

		SizeBytes:   int64(len(payload)),

		RowCount:    total,

		Status:      models.StatusPending,

		UploadedAt:  started,

		RawPayload:  payload,

	}

	if err := s.repo.CreateLogFile(ctx, lf); err != nil {

		return finish(models.SyncStatusFailed, repository.SyncHistoryStats{TotalLogs: total}, nil, err)

	}



	processResult, err := s.proc.ProcessLogFile(ctx, lf.ID, processor.ProcessOptions{})

	stats := repository.SyncHistoryStats{TotalLogs: total}

	if processResult != nil {

		stats.NewLogs = processResult.Inserted

		stats.DuplicateLogs = processResult.Duplicates

		stats.FailedLogs = processResult.FailedLogs

	}

	if err != nil {

		return finish(models.SyncStatusFailed, stats, &lf.ID, err)

	}



	freshLog, _ := s.repo.GetLogFile(ctx, lf.ID)

	result, finishErr := finish(models.SyncStatusSuccess, stats, &lf.ID, nil)

	if result != nil {

		result.LogFile = freshLog

		result.Process = processResult

		result.Connection = fetch.Properties

	}

	return result, finishErr

}



func (s *Service) syncViaRemote(

	ctx context.Context,

	machine models.PunchMachine,

	history *models.DeviceSyncHistory,

	started time.Time,

	finish func(string, repository.SyncHistoryStats, *uuid.UUID, error) (*Result, error),

) (*Result, error) {

	to := timeutil.Now()

	from := started.AddDate(0, 0, -s.remoteLookbackDays)



	remoteResult, err := s.remote.Collect(ctx, collector.RemoteCollectRequest{

		CompanyID: machine.CompanyID,

		From:      &from,

		To:        &to,

	})

	if err != nil {

		return finish(models.SyncStatusFailed, repository.SyncHistoryStats{}, nil,

			fmt.Errorf("LAN sync failed (RWB); remote SQL collect failed: %w", err))

	}



	stats := repository.SyncHistoryStats{

		TotalLogs:     remoteResult.RemoteRows,

		NewLogs:       remoteResult.Inserted,

		DuplicateLogs: remoteResult.Duplicates,

	}

	var logFileID *uuid.UUID

	if remoteResult.LogFile != nil {

		logFileID = &remoteResult.LogFile.ID

	}



	result, finishErr := finish(models.SyncStatusSuccess, stats, logFileID, nil)

	if result != nil {

		result.LogFile = remoteResult.LogFile

	}

	return result, finishErr

}



func isRWBError(err error) bool {

	return err != nil && strings.Contains(strings.ToLower(err.Error()), "rwb")

}



func trimErr(err error) string {

	msg := strings.TrimSpace(err.Error())

	if len(msg) > 1900 {

		msg = msg[:1900] + "..."

	}

	return msg

}



func ptrTime(t time.Time) *time.Time { return &t }


