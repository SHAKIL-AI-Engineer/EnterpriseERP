import { redirect } from "next/navigation";

export default function AttendanceIndexPage() {
  redirect("/management/attendance/daily-report");
}
