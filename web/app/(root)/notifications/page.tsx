"use client"

import * as React from "react"
import Link from "next/link"
import {
    IconBell,
    IconCheck,
    IconTrash,
    IconInfoCircle,
    IconAlertTriangle,
    IconCircleCheck,
    IconMail,
    IconDotsVertical,
    IconSearch,
    IconClock,
    IconSettings
} from "@tabler/icons-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { notificationService, type Notification } from "@/lib/services/notificationService"
import { useNotificationStream } from "@/hooks/useNotificationStream"
import { authService } from "@/lib/services/auth"

export default function NotificationsPage() {
    const [notifications, setNotifications] = React.useState<Notification[]>([])
    const [searchTerm, setSearchTerm] = React.useState("")
    const [activeTab, setActiveTab] = React.useState("all")
    const [selectedNotification, setSelectedNotification] = React.useState<Notification | null>(null)
    const [detailsOpen, setDetailsOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(true)

    const currentUser = authService.getCurrentUser() as any
    const userId: string | null = currentUser?.id || currentUser?.userId || null

    React.useEffect(() => {
        if (!userId) { setLoading(false); return }
        notificationService.fetchByRecipient(userId)
            .then(list => setNotifications(list))
            .catch(() => toast.error("Could not load notifications. Is the Notification service running?"))
            .finally(() => setLoading(false))
    }, [userId])

    useNotificationStream({
        recipientId: userId,
        enabled: !!userId,
        onNotification: (n) => {
            setNotifications(prev => [n, ...prev])
            toast.info(n.subject)
        },
    })

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.body.toLowerCase().includes(searchTerm.toLowerCase())
        if (activeTab === "unread") return matchesSearch && n.status !== "Read"
        return matchesSearch
    })

    const markAsRead = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        await notificationService.markRead(id).catch(() => {})
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "Read" as const } : n))
    }

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => n.status !== "Read")
        await Promise.allSettled(unread.map(n => notificationService.markRead(n.id)))
        setNotifications(prev => prev.map(n => ({ ...n, status: "Read" as const })))
        toast.success("All notifications marked as read")
    }

    const deleteNotification = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        await notificationService.remove(id).catch(() => {})
        setNotifications(prev => prev.filter(n => n.id !== id))
        toast.success("Notification deleted")
    }

    const handleViewDetails = async (notification: Notification) => {
        setSelectedNotification(notification)
        if (notification.status !== "Read") {
            await markAsRead(notification.id)
        }
        setDetailsOpen(true)
    }

    const getTypeHint = (n: Notification) => {
        const s = n.subject.toLowerCase()
        if (s.includes("required") || s.includes("alert") || s.includes("breakdown")) return "alert"
        if (s.includes("approved") || s.includes("ready") || s.includes("processed") || s.includes("welcome")) return "success"
        if (s.includes("error") || s.includes("failed") || s.includes("critical")) return "error"
        return "info"
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "alert": return <IconAlertTriangle className="size-5 text-amber-500" />
            case "success": return <IconCircleCheck className="size-5 text-emerald-500" />
            case "error": return <IconAlertTriangle className="size-5 text-red-500" />
            default: return <IconInfoCircle className="size-5 text-blue-500" />
        }
    }

    const formatTime = (iso: string) => {
        const d = new Date(iso)
        const now = new Date()
        const diffMs = now.getTime() - d.getTime()
        const diffMin = Math.floor(diffMs / 60000)
        if (diffMin < 1) return "just now"
        if (diffMin < 60) return `${diffMin}m ago`
        const diffH = Math.floor(diffMin / 60)
        if (diffH < 24) return `${diffH}h ago`
        return `${Math.floor(diffH / 24)}d ago`
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-muted/5">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-background sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconBell className="size-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
                        <p className="text-sm text-muted-foreground">Manage your alerts and messages</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={markAllAsRead}>
                        <IconCheck className="mr-2 size-4" />
                        Mark all as read
                    </Button>
                    <Link href="/settings">
                        <Button variant="outline" size="icon" className="h-9 w-9" title="Notification Settings">
                            <IconSettings className="size-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                <div className="w-full md:w-64 border-r bg-background/50 p-4 hidden md:block">
                    <div className="space-y-4">
                        <div className="font-semibold text-sm px-2">Filters</div>
                        <nav className="space-y-1">
                            {[
                                { label: "All", value: "all", icon: IconMail },
                                { label: "Unread", value: "unread", icon: IconBell },
                            ].map((item) => (
                                <Button
                                    key={item.value}
                                    variant={activeTab === item.value ? "secondary" : "ghost"}
                                    className="w-full justify-start font-normal"
                                    onClick={() => setActiveTab(item.value)}
                                >
                                    <item.icon className="mr-2 size-4" />
                                    {item.label}
                                    {item.value === "unread" && notifications.filter(n => n.status !== "Read").length > 0 && (
                                        <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5 min-w-5 flex items-center justify-center">
                                            {notifications.filter(n => n.status !== "Read").length}
                                        </Badge>
                                    )}
                                </Button>
                            ))}
                        </nav>

                        <Separator />

                        <div className="font-semibold text-sm px-2">Types</div>
                        <nav className="space-y-1">
                            {["InApp", "Email", "SMS"].map((type) => (
                                <Button key={type} variant="ghost" className="w-full justify-start font-normal text-muted-foreground">
                                    <span className={`mr-2 h-2 w-2 rounded-full ${type === 'InApp' ? 'bg-blue-500' : type === 'Email' ? 'bg-purple-500' : 'bg-green-500'}`} />
                                    {type}
                                </Button>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-w-0 bg-background">
                    <div className="p-4 border-b flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search notifications..."
                                className="pl-9 bg-muted/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <Select defaultValue="newest">
                                <SelectTrigger className="w-[140px] h-9">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest first</SelectItem>
                                    <SelectItem value="oldest">Oldest first</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="flex flex-col">
                            {loading ? (
                                <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                                    Loading notifications...
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
                                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <IconBell className="size-8 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-lg font-medium">No notifications found</p>
                                    <p className="text-sm">You&apos;re all caught up!</p>
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => {
                                    const typeHint = getTypeHint(notification)
                                    const isUnread = notification.status !== "Read"
                                    return (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleViewDetails(notification)}
                                            className={cn(
                                                "group flex items-start gap-4 p-4 border-b hover:bg-muted/30 transition-colors relative cursor-pointer",
                                                isUnread ? "bg-primary/5 hover:bg-primary/10" : "bg-background"
                                            )}
                                        >
                                            <div className="mt-1">
                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border">
                                                    {getIcon(typeHint)}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm truncate">{notification.subject}</span>
                                                        <Badge variant="outline" className="text-[10px] h-4 font-normal text-muted-foreground">
                                                            {notification.type}
                                                        </Badge>
                                                        {isUnread && (
                                                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                                        <IconClock className="size-3" />
                                                        {formatTime(notification.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-foreground/80 line-clamp-2">
                                                    {notification.body}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-1 rounded-md shadow-sm">
                                                {isUnread && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => markAsRead(notification.id, e)} title="Mark as read">
                                                        <IconCheck className="size-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => deleteNotification(notification.id, e)} title="Delete">
                                                    <IconTrash className="size-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                            <IconDotsVertical className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetails(notification) }}>View Details</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
                <SheetContent className="sm:max-w-md w-full">
                    <SheetHeader>
                        <SheetTitle>Notification Details</SheetTitle>
                        <SheetDescription>
                            Full details of the selected notification.
                        </SheetDescription>
                    </SheetHeader>
                    {selectedNotification && (
                        <div className="flex flex-col gap-6 py-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src="" />
                                    <AvatarFallback>NT</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-semibold text-lg">{selectedNotification.type}</h4>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{selectedNotification.status}</Badge>
                                        <span className="text-xs text-muted-foreground">{formatTime(selectedNotification.createdAt)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-4 rounded-lg flex items-start gap-3 border ${
                                getTypeHint(selectedNotification) === 'alert' ? 'bg-amber-50 border-amber-100 text-amber-900' :
                                getTypeHint(selectedNotification) === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' :
                                getTypeHint(selectedNotification) === 'error' ? 'bg-red-50 border-red-100 text-red-900' :
                                'bg-blue-50 border-blue-100 text-blue-900'
                            }`}>
                                <div className="mt-0.5">
                                    {getIcon(getTypeHint(selectedNotification))}
                                </div>
                                <div>
                                    <h5 className="font-bold text-sm mb-1">{selectedNotification.subject}</h5>
                                    <p className="text-sm opacity-90">{selectedNotification.body}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h5 className="font-semibold text-sm">Actions</h5>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="destructive" onClick={() => { deleteNotification(selectedNotification.id); setDetailsOpen(false) }}>
                                        <IconTrash className="mr-2 size-4" /> Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
