"use client"

import * as React from "react"
import {
    IconUsers,
    IconUserPlus,
    IconShieldLock,
    IconMail,
    IconSearch,
    IconDotsVertical,
    IconCheck,
    IconX,
    IconEdit
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock Data
const TEAM_MEMBERS = [
    { id: "1", name: "Alex Morgan", email: "alex.m@example.com", role: "SuperAdmin", status: "Active", avatar: "AM", color: "bg-indigo-500" },
    { id: "2", name: "David Chen", email: "david.c@example.com", role: "Manager", status: "Active", avatar: "DC", color: "bg-emerald-500" },
    { id: "3", name: "Sarah Jenkins", email: "sarah.j@example.com", role: "HR Officer", status: "Invited", avatar: "SJ", color: "bg-rose-500" },
    { id: "4", name: "Michael Chang", email: "mike.c@example.com", role: "ProductionManager", status: "Active", avatar: "MC", color: "bg-amber-500" },
    { id: "5", name: "Emily Davis", email: "emily.d@example.com", role: "Accountant", status: "Active", avatar: "ED", color: "bg-blue-500" },
    { id: "6", name: "John Smith", email: "john.s@example.com", role: "StoreKeeper", status: "Inactive", avatar: "JS", color: "bg-slate-500" },
]

export default function TeamSettingsPage() {
    const [searchQuery, setSearchQuery] = React.useState("")

    const filteredMembers = TEAM_MEMBERS.filter(member => 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-8 py-8 px-4 lg:px-8 min-h-screen bg-muted/30 dark:bg-transparent">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                            <IconUsers className="size-6 text-white" />
                        </div>
                        Team Settings
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xl">
                        Manage your team members, set their access levels, and invite new colleagues to the workspace.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl shadow-sm hover:shadow-md transition-all font-semibold h-11 border-slate-200 dark:border-border">
                        Manage Roles
                    </Button>
                    <Button className="rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all font-bold h-11 px-6 gap-2 bg-primary">
                        <IconUserPlus className="size-4" />
                        Invite Member
                    </Button>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg bg-card rounded-3xl overflow-hidden relative group transition-transform hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-indigo-500">
                        <IconUsers className="size-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground">24</div>
                        <p className="text-xs font-semibold text-emerald-500 mt-2 flex items-center gap-1">
                            <IconCheck className="size-3" /> 21 Active
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-linear-to-br from-violet-500 to-fuchsia-600 rounded-3xl overflow-hidden relative group transition-transform hover:-translate-y-1 text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <IconShieldLock className="size-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-white/80">Active Roles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black">8</div>
                        <p className="text-xs font-semibold text-white/70 mt-2">
                            Configured permission levels
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-card rounded-3xl overflow-hidden relative group transition-transform hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-rose-500">
                        <IconMail className="size-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Pending Invites</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground">3</div>
                        <p className="text-xs font-semibold text-rose-500 mt-2 flex items-center gap-1">
                            Awaiting response
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/50">
                    <h2 className="text-lg font-bold text-foreground">Active Team Members</h2>
                    <div className="relative w-full sm:w-80">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name, email, or role..."
                            className="pl-10 h-10 bg-card border-border shadow-sm rounded-xl w-full focus-visible:ring-indigo-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div data-slot="table-container" className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-xl">Member Info</th>
                                <th className="px-6 py-4">Role / Access</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 rounded-tr-xl text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-table-row-hover transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar className={`h-10 w-10 border-2 border-white dark:border-card shadow-sm ${member.color}`}>
                                                <AvatarFallback className="text-white font-bold">{member.avatar}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-bold text-foreground">{member.name}</div>
                                                <div className="text-slate-500 text-xs">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <IconShieldLock className="size-4 text-slate-400" />
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{member.role}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge 
                                            variant="outline" 
                                            className={`font-bold border px-2.5 py-0.5 shadow-sm
                                                ${member.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" : 
                                                member.status === "Invited" ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400" : 
                                                "bg-slate-100 text-slate-500 border-slate-200 dark:bg-muted dark:border-border dark:text-muted-foreground"}
                                            `}
                                        >
                                            {member.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                                                <IconEdit className="size-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                                                <IconX className="size-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredMembers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <IconSearch className="size-8 text-slate-300 dark:text-slate-600" />
                                            <p className="font-medium text-sm">No members found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
