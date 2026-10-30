import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { IconUsers } from "@tabler/icons-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function TeamPage() {
    const members = [
        { name: "John Doe", role: "HR Manager", avatar: "JD" },
        { name: "Sarah Smith", role: "Recruiter", avatar: "SS" },
        { name: "Mike Johnson", role: "Payroll Analyst", avatar: "MJ" },
        { name: "Emily Brown", role: "Benefits Coordinator", avatar: "EB" },
        { name: "Chris Wilson", role: "HR Tech Lead", avatar: "CW" },
    ]

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6">
            <div className="flex items-center gap-2">
                <IconUsers className="size-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">HR Team</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {members.map((member) => (
                    <Card key={member.name} className="hover:border-primary/50 transition-colors">
                        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                            <Avatar className="size-16">
                                <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                                    {member.avatar}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <CardTitle className="text-base">{member.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
