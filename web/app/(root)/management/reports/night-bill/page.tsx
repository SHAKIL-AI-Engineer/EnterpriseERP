"use client"

import { BillReportPage } from "@/components/reports/bill-report-page"
import { nightBillService } from "@/lib/services/bill"

export default function NightBillPage() {
    return <BillReportPage title="Night Bill" exportEndpoint="night-bills" service={nightBillService} />
}
