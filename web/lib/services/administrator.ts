import api from "@/lib/api";
import { unwrapApiData } from "@/lib/api-response";

export interface AdministratorOverview {
  requestsLast24Hours: number;
  unresolvedErrors: number;
  openBugs: number;
  source: string;
}

export interface AdministratorEvent {
  id: string;
  createdAt: string;
  level: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  traceId: string;
  actor: string;
  resolved: boolean;
  resolution: string;
  resolvedBy: string;
  resolvedAt?: string | null;
}

export interface AdministratorBug {
  id: string;
  title: string;
  priority: string;
  status: string;
  affectedPath: string;
  steps: string;
  expected: string;
  actual: string;
  notes: string;
  reportedBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type BugReport = Pick<AdministratorBug, "title" | "priority" | "affectedPath" | "steps" | "expected" | "actual">;

const base = "administrator";
export const administratorService = {
  async getOverview() {
    return unwrapApiData<AdministratorOverview>((await api.get(`${base}/overview`)).data);
  },
  async getLogs(params: { search?: string; level?: string; errorsOnly?: boolean; unresolvedOnly?: boolean; limit?: number }) {
    return unwrapApiData<AdministratorEvent[]>((await api.get(`${base}/logs`, { params })).data);
  },
  async resolveError(id: string, resolved: boolean, notes: string) {
    return unwrapApiData<AdministratorEvent>((await api.put(`${base}/errors/${encodeURIComponent(id)}/resolution`, { resolved, notes })).data);
  },
  async getBugs(params: { status?: string; search?: string } = {}) {
    return unwrapApiData<AdministratorBug[]>((await api.get(`${base}/bugs`, { params })).data);
  },
  async reportBug(report: BugReport) {
    return unwrapApiData<AdministratorBug>((await api.post(`${base}/bugs`, report)).data);
  },
  async updateBug(id: string, update: Pick<AdministratorBug, "status" | "priority" | "notes">) {
    return unwrapApiData<AdministratorBug>((await api.put(`${base}/bugs/${encodeURIComponent(id)}`, update)).data);
  },
};
