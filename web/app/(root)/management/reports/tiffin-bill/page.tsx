"use client"

import { BillReportPage } from "@/components/reports/bill-report-page"
import { tiffinBillService } from "@/lib/services/bill"

export default function TiffinBillPage() {
    return <BillReportPage title="Tiffin Bill" exportEndpoint="tiffin-bills" service={tiffinBillService} />
}
