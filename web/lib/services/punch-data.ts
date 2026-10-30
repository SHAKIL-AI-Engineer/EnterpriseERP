import api from "../api";
import { getHttpErrorMessage } from "../api-response";
import { PagedResult, downloadBlob, unwrapResponse } from "./api-helpers";

async function postPunchData<T>(path: string, body?: unknown, params?: Record<string, string>): Promise<T> {
  try {
    const response = await api.post<unknown>(path, body ?? null, { params });
    return unwrapResponse<T>(response);
  } catch (error) {
    throw new Error(getHttpErrorMessage(error, "Punch-data request failed"));
  }
}

export type PunchLogStatus = "Pending" | "Processing" | "Completed" | "Failed";
export type ImportBatchStatus = "Pending" | "Processing" | "Completed" | "Failed";

export interface PunchRecord {
  id: string;
  logFileId: string;
  companyId: number;
  punchNumber: number;
  deviceId: string;
  punchTime: string;
  source: string;
  createdAt: string;
}

export interface PunchLogFile {
  id: string;
  fileName: string;
  sourceType: string;
  contentType: string;
  deviceId: string;
  companyId: number;
  sizeBytes: number;
  rowCount: number;
  status: PunchLogStatus;
  errorMessage?: string;
  uploadedAt: string;
  processedAt?: string;
}

export interface PunchRecordInput {
  punchNumber: number;
  punchTime: string;
  deviceId?: string;
  deviceSerial?: string;
  source?: string;
}

export interface PunchBatchPayload {
  companyId?: number;
  deviceId?: string;
  source?: string;
  records: PunchRecordInput[];
}

export interface PunchProcessResult {
  logFileId: string;
  status?: string;
  rowCount?: number;
  inserted?: number;
  skipped?: number;
  duplicates?: number;
  failedLogs?: number;
  processedCount?: number;
  skippedCount?: number;
  errorCount?: number;
  message?: string;
  errorMessage?: string;
}

export interface PunchLogQuery {
  companyId?: number;
  deviceId?: string;
  status?: PunchLogStatus;
  page?: number;
  pageSize?: number;
}

export interface PunchQuery extends PunchLogQuery {
  punchNumber?: number;
  logFileId?: string;
  from?: string;
  to?: string;
}

export type MachineConnectionStatus = "Unknown" | "Connected" | "Disconnected";

export interface PunchMachine {
  id: string;
  companyId: number;
  deviceCode: string;
  deviceName: string;
  machineNo: number;
  ipAddress: string;
  port: number;
  useTcp: boolean;
  productName?: string;
  serialNumber?: string;
  isActive: boolean;
  lastConnectionStatus: MachineConnectionStatus | string;
  lastError?: string;
  lastConnectedAt?: string;
  lastSyncedAt?: string;
  lastSyncRecordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePunchMachinePayload {
  companyId: number;
  deviceCode: string;
  deviceName: string;
  machineNo: number;
  ipAddress: string;
  port: number;
  useTcp?: boolean;
  productName?: string;
  serialNumber?: string;
  password?: number;
  isActive?: boolean;
}

export interface PunchMachineQuery {
  companyId?: number;
  status?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface DeviceSyncHistory {
  id: string;
  companyId: number;
  machineId: string;
  triggerType: string;
  syncStartedAt: string;
  syncEndedAt?: string;
  totalLogs: number;
  newLogs: number;
  duplicateLogs: number;
  failedLogs: number;
  status: string;
  errorMessage?: string;
  logFileId?: string;
}

export interface SyncHistoryQuery {
  companyId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface MachineConnectionResult {
  connected: boolean;
  checkedAt: string;
  deviceId?: string;
  firmware?: string;
  deviceClock?: string;
  totalRecords: number;
  totalUsers: number;
}

export interface MachineSyncResult {
  history: DeviceSyncHistory;
  logFile?: PunchLogFile;
  process?: PunchProcessResult;
  connection?: MachineConnectionResult;
}

export interface PunchImportBatch {
  id: string;
  companyId: number;
  fileName: string;
  contentType: string;
  status: ImportBatchStatus | string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  insertedRows: number;
  duplicateRows: number;
  uploadedBy?: string;
  errorMessage?: string;
  uploadedAt: string;
  processedAt?: string;
}

export interface PunchImportError {
  id: string;
  importBatchId: string;
  companyId: number;
  rowNumber: number;
  rawRow: string;
  errorMessage: string;
  createdAt: string;
}

export interface ImportBatchQuery {
  companyId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface RemoteCollectStatus {
  configured: boolean;
  connected: boolean;
  message?: string;
  readOnly: boolean;
}

export interface RemoteCollectPreview {
  from: string;
  to: string;
  remoteRows: number;
  unmappedRemote: number;
  readOnly: boolean;
}

export interface RemoteCollectHistory {
  id: string;
  companyId: number;
  status: string;
  fromTime: string;
  toTime: string;
  remoteRows: number;
  inserted: number;
  duplicates: number;
  skippedNoBadge: number;
  unmappedRemote: number;
  logFileId?: string;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface RemoteCollectResult {
  history: RemoteCollectHistory;
  logFile?: PunchLogFile;
  remoteRows: number;
  inserted: number;
  duplicates: number;
  skippedNoBadge: number;
  unmappedRemote: number;
  pages: number;
}

export interface RemoteCollectHistoryQuery {
  companyId?: number;
  page?: number;
  pageSize?: number;
}

export interface LocalCollectStatus {
  configured: boolean;
  connected: boolean;
  message?: string;
  readOnly: boolean;
}

export interface LocalCollectPreview {
  from: string;
  to: string;
  localRows: number;
  unmappedLocal: number;
  readOnly: boolean;
}

export interface LocalCollectHistory {
  id: string;
  companyId: number;
  status: string;
  fromTime: string;
  toTime: string;
  localRows: number;
  inserted: number;
  duplicates: number;
  skippedNoBadge: number;
  unmappedLocal: number;
  logFileId?: string;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface LocalCollectResult {
  history: LocalCollectHistory;
  logFile?: PunchLogFile;
  localRows: number;
  inserted: number;
  duplicates: number;
  skippedNoBadge: number;
  unmappedLocal: number;
  pages: number;
}

export interface LocalCollectHistoryQuery {
  companyId?: number;
  page?: number;
  pageSize?: number;
}

export interface ManualPunchPayload {
  companyId: number;
  punchNumber: number;
  deviceId?: string;
  punchTime?: string;
  source?: string;
}

export interface ManualPunchResult {
  record?: PunchRecord;
  duplicate: boolean;
}

export const punchDataService = {
  uploadLog: async (
    file: File,
    data: { companyId?: number; deviceId?: string; autoProcess?: boolean } = {},
  ): Promise<PunchLogFile> => {
    const form = new FormData();
    form.append("file", file);
    if (data.companyId !== undefined) form.append("companyId", String(data.companyId));
    if (data.deviceId) form.append("deviceId", data.deviceId);
    if (data.autoProcess !== undefined) form.append("autoProcess", String(data.autoProcess));

    const response = await api.post<unknown>("punch-data/logs/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrapResponse<PunchLogFile>(response);
  },

  createBatch: async (payload: PunchBatchPayload, autoProcess = true): Promise<PunchLogFile> => {
    const response = await api.post<unknown>("punch-data/logs/batch", payload, {
      params: { autoProcess },
    });
    return unwrapResponse<PunchLogFile>(response);
  },

  getLogs: async (params: PunchLogQuery = {}): Promise<PagedResult<PunchLogFile>> => {
    const response = await api.get<unknown>("punch-data/logs", { params });
    return unwrapResponse<PagedResult<PunchLogFile>>(response);
  },

  getLog: async (id: string): Promise<PunchLogFile> => {
    const response = await api.get<unknown>(`punch-data/logs/${encodeURIComponent(id)}`);
    return unwrapResponse<PunchLogFile>(response);
  },

  downloadLog: async (id: string, fileName = "punch-log.bin"): Promise<void> => {
    const response = await api.get(`punch-data/logs/${encodeURIComponent(id)}/download`, {
      responseType: "blob",
    });
    downloadBlob(response.data, fileName);
  },

  getLogRecords: async (
    id: string,
    params: Pick<PunchQuery, "page" | "pageSize"> = {},
  ): Promise<PagedResult<PunchRecord>> => {
    const response = await api.get<unknown>(`punch-data/logs/${encodeURIComponent(id)}/records`, {
      params,
    });
    return unwrapResponse<PagedResult<PunchRecord>>(response);
  },

  processLog: async (id: string): Promise<PunchProcessResult> => {
    const response = await api.post<unknown>(`punch-data/logs/${encodeURIComponent(id)}/process`);
    return unwrapResponse<PunchProcessResult>(response);
  },

  processPending: async (limit = 50): Promise<PunchProcessResult[]> => {
    const response = await api.post<unknown>("punch-data/process", null, { params: { limit } });
    return unwrapResponse<PunchProcessResult[]>(response);
  },

  getPunches: async (params: PunchQuery = {}): Promise<PagedResult<PunchRecord>> => {
    const response = await api.get<unknown>("punch-data/punches", { params });
    return unwrapResponse<PagedResult<PunchRecord>>(response);
  },

  createManualPunch: async (payload: ManualPunchPayload): Promise<ManualPunchResult> => {
    const response = await api.post<unknown>("punch-data/punches/manual", payload);
    return unwrapResponse<ManualPunchResult>(response);
  },

  listMachines: async (params: PunchMachineQuery = {}): Promise<PagedResult<PunchMachine>> => {
    const response = await api.get<unknown>("punch-data/machines", { params });
    return unwrapResponse<PagedResult<PunchMachine>>(response);
  },

  saveMachine: async (payload: CreatePunchMachinePayload): Promise<PunchMachine> => {
    const response = await api.post<unknown>("punch-data/machines", payload);
    return unwrapResponse<PunchMachine>(response);
  },

  saveMachinesBulk: async (machines: CreatePunchMachinePayload[]): Promise<PunchMachine[]> => {
    const response = await api.post<unknown>("punch-data/machines/bulk", { machines });
    return unwrapResponse<PunchMachine[]>(response);
  },

  testConnection: async (machineId: string): Promise<MachineConnectionResult> => {
    return postPunchData<MachineConnectionResult>(
      `punch-data/machines/${encodeURIComponent(machineId)}/connect`,
    );
  },

  syncMachine: async (
    machineId: string,
    options?: { useRemote?: boolean },
  ): Promise<MachineSyncResult> => {
    try {
      const params: Record<string, string> = {};
      if (options?.useRemote) {
        params.useRemote = "true";
      }
      const response = await api.post<unknown>(
        `punch-data/machines/${encodeURIComponent(machineId)}/sync`,
        null,
        { params },
      );
      return unwrapResponse<MachineSyncResult>(response);
    } catch (error) {
      throw new Error(getHttpErrorMessage(error, "Machine sync failed"));
    }
  },

  listImportBatches: async (params: ImportBatchQuery = {}): Promise<PagedResult<PunchImportBatch>> => {
    const response = await api.get<unknown>("punch-data/imports", { params });
    return unwrapResponse<PagedResult<PunchImportBatch>>(response);
  },

  listImportErrors: async (
    batchId: string,
    params: { page?: number; pageSize?: number } = {},
  ): Promise<PagedResult<PunchImportError>> => {
    const response = await api.get<unknown>(
      `punch-data/imports/${encodeURIComponent(batchId)}/errors`,
      { params },
    );
    return unwrapResponse<PagedResult<PunchImportError>>(response);
  },

  getRemoteCollectStatus: async (): Promise<RemoteCollectStatus> => {
    const response = await api.get<unknown>("punch-data/remote/collect/status");
    return unwrapResponse<RemoteCollectStatus>(response);
  },

  previewRemoteCollect: async (params: { from?: string; to?: string } = {}): Promise<RemoteCollectPreview> => {
    const response = await api.get<unknown>("punch-data/remote/collect/preview", { params });
    return unwrapResponse<RemoteCollectPreview>(response);
  },

  collectRemote: async (data: {
    companyId: number;
    from?: string;
    to?: string;
    batchSize?: number;
    useWatermark?: boolean;
  }): Promise<RemoteCollectResult> => {
    const response = await api.post<unknown>("punch-data/remote/collect", {
      companyId: data.companyId,
      from: data.from,
      to: data.to,
      batchSize: data.batchSize,
      useWatermark: data.useWatermark,
    });
    return unwrapResponse<RemoteCollectResult>(response);
  },

  listRemoteCollectHistories: async (
    params: RemoteCollectHistoryQuery = {},
  ): Promise<PagedResult<RemoteCollectHistory>> => {
    const response = await api.get<unknown>("punch-data/remote/collect/histories", { params });
    return unwrapResponse<PagedResult<RemoteCollectHistory>>(response);
  },

  getLocalCollectStatus: async (): Promise<LocalCollectStatus> => {
    const response = await api.get<unknown>("punch-data/local/collect/status");
    return unwrapResponse<LocalCollectStatus>(response);
  },

  previewLocalCollect: async (params: { from?: string; to?: string } = {}): Promise<LocalCollectPreview> => {
    const response = await api.get<unknown>("punch-data/local/collect/preview", { params });
    return unwrapResponse<LocalCollectPreview>(response);
  },

  collectLocal: async (data: {
    companyId: number;
    from?: string;
    to?: string;
    batchSize?: number;
    useWatermark?: boolean;
  }): Promise<LocalCollectResult> => {
    const response = await api.post<unknown>("punch-data/local/collect", {
      companyId: data.companyId,
      from: data.from,
      to: data.to,
      batchSize: data.batchSize,
      useWatermark: data.useWatermark,
    });
    return unwrapResponse<LocalCollectResult>(response);
  },

  listLocalCollectHistories: async (
    params: LocalCollectHistoryQuery = {},
  ): Promise<PagedResult<LocalCollectHistory>> => {
    const response = await api.get<unknown>("punch-data/local/collect/histories", { params });
    return unwrapResponse<PagedResult<LocalCollectHistory>>(response);
  },

  listSyncHistories: async (
    params: SyncHistoryQuery = {},
  ): Promise<PagedResult<DeviceSyncHistory>> => {
    const response = await api.get<unknown>("punch-data/sync-histories", { params });
    return unwrapResponse<PagedResult<DeviceSyncHistory>>(response);
  },
};
