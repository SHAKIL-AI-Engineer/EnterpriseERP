import { redirect } from "next/navigation"

export default function PayrollApprovalRedirectPage() {
    redirect("/management/payroll/salary-process")
}
