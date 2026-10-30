"use client"

import { BillReportPage } from "@/components/reports/bill-report-page"
import { ifterBillService } from "@/lib/services/bill"

export default function IfterBillPage() {
    return <BillReportPage title="Ifter Bill" exportEndpoint="ifter-bills" service={ifterBillService} />
}
