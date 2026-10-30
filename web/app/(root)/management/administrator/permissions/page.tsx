"use client"

import * as React from "react"
import {
    IconShieldLock,
    IconLock,
    IconPlus,
    IconUsers,
    IconKey,
    IconDotsVertical,
    IconEdit,
    IconTrash,
    IconEye,
    IconHistory,
    IconCheck,
    IconRefresh,
    IconSettings,
    IconShieldCheck
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authService, type RoleDetails, type UpdatePermissionDto } from "@/lib/services/auth"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

type EnhancedRole = RoleDetails & {
    permissions: string[]
    status: "Active" | "Draft" | "Archived"
    lastUpdated: string
}

export default function PermissionsPage() {
    const [roles, setRoles] = React.useState<EnhancedRole[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isRefreshing, setIsRefreshing] = React.useState(false)

    // Data State
    const [allPermissions, setAllPermissions] = React.useState<string[]>([])

    // Create Role State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [newRoleName, setNewRoleName] = React.useState("")
    const [isCreating, setIsCreating] = React.useState(false)

    // Edit Permissions State
    const [isPermissionDialogOpen, setIsPermissionDialogOpen] = React.useState(false)
    const [selectedRole, setSelectedRole] = React.useState<EnhancedRole | null>(null)
    const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([])
    const [isSavingPermissions, setIsSavingPermissions] = React.useState(false)

    const fetchData = React.useCallback(async (silent = false) => {
        if (silent) setIsRefreshing(true)
        else setIsLoading(true)

        try {
            const [rolesData, permissionsData] = await Promise.all([
                authService.getRoles(),
                authService.getAllPermissions(),
                new Promise(resolve => setTimeout(resolve, 800)) // Slight delay for smooth transition
            ])

            // Enhance roles with permissions data specifically for that role
            const enhancedData: EnhancedRole[] = rolesData.map(role => ({
                ...role,
                permissions: role.permissions ?? [],
                status: "Active",
                lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            }))

            setRoles(enhancedData)
            setAllPermissions(permissionsData)
        } catch (error: any) {
            toast.error("Failed to load Authority Matrix", {
                description: error.response?.data?.message || "Verify your administrative permissions."
            })
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleCreateRole = async () => {
        if (!newRoleName) return
        setIsCreating(true)
        try {
            const result = await authService.createRole(newRoleName)
            if (result.success) {
                toast.success("Identity Role Created", {
                    description: `New authority level "${newRoleName}" added to system.`
                })
                setIsCreateDialogOpen(false)
                setNewRoleName("")
                fetchData(true)
            } else {
                toast.error("Creation Failed", { description: result.message })
            }
        } catch (error: any) {
            toast.error("Creation Failed", {
                description: error.response?.data?.message || "Role might already exist."
            })
        } finally {
            setIsCreating(false)
        }
    }

    const openPermissionEditor = async (role: EnhancedRole) => {
        setSelectedRole(role)
        setIsPermissionDialogOpen(true)
        try {
            const data = await authService.getRolePermissions(role.name)
            setSelectedPermissions(data.permissions)
        } catch (error) {
            toast.error("Failed to fetch role permissions")
        }
    }

    const handleSavePermissions = async () => {
        if (!selectedRole) return
        setIsSavingPermissions(true)
        try {
            const dto: UpdatePermissionDto = {
                roleId: selectedRole.id,
                permissions: selectedPermissions
            }
            const result = await authService.updateRolePermissions(dto)
            if (result.success) {
                toast.success("Permissions Updated", {
                    description: `Access scope for ${selectedRole.name} has been updated.`
                })
                setIsPermissionDialogOpen(false)
            } else {
                toast.error("Update Failed", { description: result.message })
            }
        } catch (error: any) {
            toast.error("Update Failed", {
                description: error.response?.data?.message || "Something went wrong."
            })
        } finally {
            setIsSavingPermissions(false)
        }
    }

    const togglePermission = (perm: string) => {
        setSelectedPermissions(prev =>
            prev.includes(perm)
                ? prev.filter(p => p !== perm)
                : [...prev, perm]
        )
    }

    const columns: ColumnDef<EnhancedRole>[] = [
        {
            accessorKey: "name",
            header: () => <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">Role Entity</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-3 px-2">
                    <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-xs uppercase">
                        {row.original.name[0]}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold tracking-tight">{row.getValue("name")}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">System Role</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "userCount",
            header: () => <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Users</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 font-medium tabular-nums text-slate-600 dark:text-slate-400">
                    <IconUsers className="size-4 opacity-50" />
                    <span className="text-xs">{row.getValue("userCount")}</span>
                </div>
            )
        },
        {
            accessorKey: "status",
            header: () => <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>,
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge
                        variant={status === "Active" ? "success" : "secondary"}
                        className="h-5 px-2 text-[10px] font-bold uppercase tracking-tight"
                    >
                        {status === "Active" && <IconCheck className="size-2.5 mr-1" />}
                        {status}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            header: () => <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 text-right block">Actions</span>,
            cell: ({ row }) => (
                <div className="flex justify-end px-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-2 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => openPermissionEditor(row.original)}
                    >
                        <IconSettings className="size-3.5" />
                        Configure
                    </Button>
                </div>
            )
        }
    ]

    const groupedPermissions = React.useMemo(() => {
        const groups: Record<string, string[]> = {}
        allPermissions.forEach(perm => {
            const parts = perm.split('.')
            const groupName = parts.length > 1 ? parts[1] : 'General'
            if (!groups[groupName]) groups[groupName] = []
            groups[groupName].push(perm)
        })
        return groups
    }, [allPermissions])

    const stats = {
        total: roles.length,
        permissions: allPermissions.length,
        users: roles.reduce((acc, r) => acc + r.userCount, 0),
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Authority Matrix</h1>
                    <p className="text-sm text-muted-foreground">Manage role definitions and access control.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => fetchData(true)}
                        disabled={isLoading || isRefreshing}
                        size="sm"
                    >
                        <IconRefresh className={cn("size-4 mr-2", (isLoading || isRefreshing) && "animate-spin")} />
                        Reload
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        <IconPlus className="size-4 mr-2" />
                        Add Role
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <UserStat label="Total Roles" value={stats.total.toString()} />
                <UserStat label="Permissions" value={stats.permissions.toString()} />
                <UserStat label="Assigned Users" value={stats.users.toString()} />
                <UserStat label="Status" value="Optimal" />
            </div>

            <Card className="rounded-md">
                <DataTable
                    data={roles}
                    columns={columns}
                    searchKey="name"
                    enableSelection={true}
                    enableDrag={true}
                    isLoading={isLoading || isRefreshing}
                />
            </Card>

            {/* Create Role Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Role</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Role Name</Label>
                            <Input
                                placeholder="e.g. Finance Officer"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateRole} disabled={!newRoleName || isCreating}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permission Editor Dialog */}
            <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 border-b shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            {selectedRole?.name} Permissions
                        </DialogTitle>
                        <DialogDescription>
                            Configure access controls for this role.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(groupedPermissions).map(([group, perms]) => (
                                <div key={group} className="space-y-3 p-4 border rounded-md">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-sm">{group} Module</h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => {
                                                const allGroup = perms.every(p => selectedPermissions.includes(p));
                                                if (allGroup) {
                                                    setSelectedPermissions(prev => prev.filter(p => !perms.includes(p)));
                                                } else {
                                                    setSelectedPermissions(prev => [...new Set([...prev, ...perms])]);
                                                }
                                            }}
                                        >
                                            Toggle All
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {perms.map(perm => (
                                            <div key={perm} className="flex items-start space-x-2 p-1">
                                                <Checkbox
                                                    id={perm}
                                                    checked={selectedPermissions.includes(perm)}
                                                    onCheckedChange={() => togglePermission(perm)}
                                                />
                                                <div className="grid gap-0.5 leading-none">
                                                    <label htmlFor={perm} className="text-sm font-medium leading-none cursor-pointer">
                                                        {perm.split('.').pop()}
                                                    </label>
                                                    <span className="text-[10px] text-muted-foreground">{perm}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 border-t shrink-0">
                        <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSavePermissions} disabled={isSavingPermissions}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function UserStat({ label, value }: { label: string; value: string }) {
    return (
        <Card className="rounded-md">
            <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
            </CardContent>
        </Card>
    )
}
