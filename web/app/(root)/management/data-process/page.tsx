import Link from "next/link"
import {
    IconCalendarStats,
    IconCloudDownload,
    IconDatabase,
    IconDeviceDesktop,
    IconFileImport,
    IconFileText,
    IconRefresh,
    IconServer,
    IconUsers,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const punchPages = [
    {
        title: "Punch Machines",
        description: "Register ZKTeco devices, test LAN connection, and collect punches from devices.",
        href: "/management/data-process/machines",
        icon: IconDeviceDesktop,
    },
    {
        title: "Log Files",
        description: "Upload CSV/JSON punch logs, process pending files, and download raw payloads.",
        href: "/management/data-process/log-files",
        icon: IconFileText,
    },
    {
        title: "Punch Records",
        description: "Browse normalized punch rows and add manual punch entries.",
        href: "/management/data-process/punches",
        icon: IconUsers,
    },
    {
        title: "File Import",
        description: "Import batch history and row-level validation errors from file uploads.",
        href: "/management/data-process/import",
        icon: IconFileImport,
    },
    {
        title: "Remote Collect",
        description: "Read-only import from public ZKTeco SQL Server into PunchRecords.",
        href: "/management/data-process/remote-collect",
        icon: IconServer,
    },
    {
        title: "Local Collect",
        description: "Read-only import from the local ZKTeco Access MDB file into PunchRecords.",
        href: "/management/data-process/local-collect",
        icon: IconDatabase,
    },
]

const processPages = [
    {
        title: "Daily Process",
        description: "Run daily attendance processing for a company and date range.",
        href: "/management/data-process/daily-process",
        icon: IconCalendarStats,
    },
    {
        title: "Monthly Process",
        description: "Monthly attendance and payroll preparation workflows.",
        href: "/management/data-process/monthly-process",
        icon: IconCloudDownload,
    },
]

export default function DataProcessPage() {
    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6">
            <div className="flex items-center gap-2">
                <IconRefresh className="size-6 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Data Process</h1>
                    <p className="text-sm text-muted-foreground">
                        PunchData collection (port 5050 via gateway) and attendance processing.
                    </p>
                </div>
            </div>

            <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    PunchData Service
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {punchPages.map((page) => (
                        <Card key={page.href} className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <page.icon className="size-5 text-primary" />
                                    {page.title}
                                </CardTitle>
                                <CardDescription className="text-sm">{page.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button size="sm" asChild>
                                    <Link href={page.href}>Open</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Attendance Processing
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
                    {processPages.map((page) => (
                        <Card key={page.href} className="border shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <page.icon className="size-5 text-primary" />
                                    {page.title}
                                </CardTitle>
                                <CardDescription className="text-sm">{page.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={page.href}>Open</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Card className="border-dashed bg-muted/30">
                <CardContent className="p-4 text-sm text-muted-foreground">
                    When adding a new company, update{" "}
                    <code className="text-xs">PunchData:CompanyIdByGuid</code> in Platform.Host and{" "}
                    <code className="text-xs">hrhub/lib/punch-company.ts</code> so punch APIs use the correct
                    numeric company id.
                </CardContent>
            </Card>
        </div>
    )
}
