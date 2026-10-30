import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { IconReport } from "@tabler/icons-react"

export default function ReportsPage() {
    const reports = [
        { title: "Employee Turnover Report", date: "Jan 25, 2026" },
        { title: "Attendance Exceptions", date: "Jan 28, 2026" },
        { title: "Department Salary Expense", date: "Jan 20, 2026" },
    ]

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6">
            <div className="flex items-center gap-2">
                <IconReport className="size-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">System Reports</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reports.map((report, i) => (
                    <Card key={i} className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">{report.title}</CardTitle>
                            <p className="text-xs text-muted-foreground italic">Last generated: {report.date}</p>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
