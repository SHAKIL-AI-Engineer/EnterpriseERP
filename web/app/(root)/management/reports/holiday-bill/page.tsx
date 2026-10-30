"use client"

import { BillReportPage } from "@/components/reports/bill-report-page"
import { holidayBillService } from "@/lib/services/bill"

export default function HolidayBillPage() {
    return <BillReportPage title="Holiday Bill" exportEndpoint="holiday-bills" service={holidayBillService} />
}
