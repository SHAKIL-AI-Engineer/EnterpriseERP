import api from '@/lib/api';
import { unwrapApiData } from '@/lib/api-response';

export interface DashboardSummary {
  totalWorkforce: number;
  presentToday: number;
  onLeaveToday: number;
  openPositions: number;
  workforceGrowth: number;
  attendanceTrend: number;
}

export interface AttendanceStat {
  date: string;
  presentCount: number;
  targetCount: number;
}

export interface DepartmentStat {
  departmentName: string;
  employeeCount: number;
  color: string;
}

export interface RecentHire {
  name: string;
  position: string;
  department: string;
  joinDate: string;
  imageUrl: string;
}

export interface UpcomingEvent {
  name: string;
  eventType: string;
  date: string;
  color: string;
}

export const getDashboardSummary = async () => {
  const response = await api.get<unknown>('/dashboard/summary');
  return unwrapApiData<DashboardSummary>(response.data);
};

export const getAttendanceStats = async () => {
  const response = await api.get<unknown>('/dashboard/attendance-stats');
  return unwrapApiData<AttendanceStat[]>(response.data);
};

export const getDepartmentStats = async () => {
  const response = await api.get<unknown>('/dashboard/department-stats');
  return unwrapApiData<DepartmentStat[]>(response.data);
};

export const getRecentHires = async () => {
  const response = await api.get<unknown>('/dashboard/recent-hires');
  return unwrapApiData<RecentHire[]>(response.data);
};

export const getUpcomingEvents = async () => {
  const response = await api.get<unknown>('/dashboard/upcoming-events');
  return unwrapApiData<UpcomingEvent[]>(response.data);
};
