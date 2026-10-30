import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconFolder } from "@tabler/icons-react"
import { Progress } from "@/components/ui/progress"

export default function ProjectsPage() {
    const projects = [
        { name: "Global Expansion HR Sync", progress: 65, team: "HR Tech", deadline: "Mar 2026" },
        { name: "New Benefit Enrollment", progress: 90, team: "Benefits", deadline: "Feb 2026" },
        { name: "Employee Survey 2026", progress: 25, team: "Culture", deadline: "May 2026" },
    ]

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6">
            <div className="flex items-center gap-2">
                <IconFolder className="size-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">Active Projects</h1>
            </div>

            <div className="grid gap-6">
                {projects.map((project) => (
                    <Card key={project.name}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-bold">{project.name}</CardTitle>
                            <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md">{project.deadline}</span>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Team: {project.team}</span>
                                <span className="font-bold">{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
