"use client"

import * as React from "react"
import {
    IconRefresh,
    IconShieldCheck,
    IconX,
    IconBuildingCommunity,
    IconDotsVertical,
    IconUserPlus,
    IconLoader,
    IconUsers
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { authService, type User, type RoleDetails, type UserLoginHistory } from "@/lib/services/auth"
import { companyService, Company } from "@/lib/services/company"
import { LoadingOverlay } from "@/components/loading-state"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NativeSelect } from "@/components/ui/native-select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function UsersPage() {
    const [users, setUsers] = React.useState<User[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isRefreshing, setIsRefreshing] = React.useState(false)

    // Role Dialog State
    const [roles, setRoles] = React.useState<RoleDetails[]>([])
    const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
    const [targetRole, setTargetRole] = React.useState<string>("")
    const [isRoleDialogOpen, setIsRoleDialogOpen] = React.useState(false)
    const [isAssigning, setIsAssigning] = React.useState(false)

    // Edit Dialog State
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
    const [editForm, setEditForm] = React.useState({ fullName: "", email: "", isActive: true })
    const [isUpdating, setIsUpdating] = React.useState(false)

    // Delete Dialog State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [isDeleting, setIsDeleting] = React.useState(false)

    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false)
    const [isChangingPassword, setIsChangingPassword] = React.useState(false)
    const [passwordForm, setPasswordForm] = React.useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
    const [passwordError, setPasswordError] = React.useState("")

    // Create Dialog State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [createForm, setCreateForm] = React.useState({
        username: "",
        email: "",
        password: "",
        fullName: "",
        role: ""
    })
    const [isCreating, setIsCreating] = React.useState(false)

    // Company Assignment State
    const [allCompanies, setAllCompanies] = React.useState<Company[]>([])
    const [selectedCompanyIds, setSelectedCompanyIds] = React.useState<string[]>([])
    const [isCompanyDialogOpen, setIsCompanyDialogOpen] = React.useState(false)
    const [isAssigningCompanies, setIsAssigningCompanies] = React.useState(false)

    // Login History State
    const [isLoginHistoryOpen, setIsLoginHistoryOpen] = React.useState(false)
    const [isLoadingHistory, setIsLoadingHistory] = React.useState(false)
    const [loginHistory, setLoginHistory] = React.useState<UserLoginHistory[]>([])

    const fetchUsers = React.useCallback(async (silent = false) => {
        if (silent) setIsRefreshing(true)
        else setIsLoading(true)

        try {
            const [userData, rolesData] = await Promise.all([
                authService.getUsers(),
                authService.getRoles(),
                new Promise(resolve => setTimeout(resolve, 800))
            ])
            setUsers(userData)
            setRoles(rolesData)
            try {
                setAllCompanies(await companyService.getAll())
            } catch (companyError) {
                console.error(companyError)
                setAllCompanies([])
            }
        } catch (error: any) {
            toast.error("Failed to fetch users")
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    React.useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleAssignRole = async () => {
        if (!selectedUser || !targetRole) return

        setIsAssigning(true)
        try {
            const result = await authService.assignRole(selectedUser.id, targetRole, selectedUser.roles ?? [])
            if (result.success) {
                toast.success("Role Assigned")
                setSelectedUser(prev => prev ? { ...prev, roles: [...prev.roles, targetRole] } : null)
                setTargetRole("")
                setIsRoleDialogOpen(false)
                fetchUsers(true)
            } else {
                toast.error(result.message)
            }
        } catch (error: any) {
            toast.error("Something went wrong.")
        } finally {
            setIsAssigning(false)
        }
    }

    const handleRemoveRole = async (role: string) => {
        if (!selectedUser) return

        try {
            const result = await authService.removeRole(selectedUser.id, role, selectedUser.roles ?? [])
            if (result.success) {
                toast.success("Role Removed")
                setSelectedUser(prev => prev ? { ...prev, roles: prev.roles.filter(r => r !== role) } : null)
                fetchUsers(true)
            } else {
                toast.error(result.message)
            }
        } catch (error: any) {
            toast.error("Something went wrong.")
        }
    }

    const handleUpdateUser = async () => {
        if (!selectedUser) return

        setIsUpdating(true)
        try {
            const result = await authService.updateUser(selectedUser.id, editForm)
            if (result.success) {
                toast.success("User Updated")
                setIsEditDialogOpen(false)
                fetchUsers(true)
            } else {
                toast.error(result.message)
            }
        } catch (error: any) {
            toast.error("Something went wrong.")
        } finally {
            setIsUpdating(false)
        }
    }

    const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!selectedUser || isChangingPassword) return
        setPasswordError("")
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError("New password and confirmation do not match.")
            return
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$/.test(passwordForm.newPassword)) {
            setPasswordError("Use 10 to 128 characters, including uppercase, lowercase and a number.")
            return
        }
        setIsChangingPassword(true)
        try {
            const result = await authService.changeUserPassword(selectedUser.id, passwordForm)
            if (!result.success) {
                setPasswordError(result.message)
                return
            }
            toast.success(result.message)
            setIsPasswordDialogOpen(false)
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
            if (authService.getCurrentUser()?.id === selectedUser.id) await authService.logout()
        } finally {
            setIsChangingPassword(false)
        }
    }

    const handleDeleteUser = async () => {
        if (!selectedUser) return

        setIsDeleting(true)
        try {
            const result = await authService.deleteUser(selectedUser.id)
            if (result.success) {
                toast.success("User Deleted")
                setIsDeleteDialogOpen(false)
                fetchUsers(true)
            } else {
                toast.error(result.message)
            }
        } catch (error: any) {
            toast.error("Something went wrong.")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCreateUser = async () => {
        if (!createForm.username || !createForm.password || !createForm.email) {
            toast.error("Please fill in all required fields.")
            return
        }

        if (createForm.role && createForm.role !== "SuperAdmin" && selectedCompanyIds.length === 0) {
            toast.error("Assign at least one company for non-SuperAdmin users.")
            return
        }

        setIsCreating(true)
        try {
            const result = await authService.createUser({
                ...createForm,
                companyIds:
                    createForm.role && createForm.role !== "SuperAdmin"
                        ? selectedCompanyIds
                        : undefined,
                companies: allCompanies,
            })
            if (result.success) {
                toast.success(result.message)
                setIsCreateDialogOpen(false)
                setCreateForm({ username: "", email: "", password: "", fullName: "", role: "" })
                setSelectedCompanyIds([])
                fetchUsers(true)
            } else {
                toast.error(result.message)
            }
        } catch (error: any) {
            toast.error("Something went wrong.")
        } finally {
            setIsCreating(false)
        }
    }

    const handleAssignCompanies = async () => {
        if (!selectedUser) return

        const requiresCompany = !selectedUser.roles?.includes("SuperAdmin")
        if (requiresCompany && selectedCompanyIds.length === 0) {
            toast.error("At least one company must be assigned for this user to sign in.")
            return
        }

        setIsAssigningCompanies(true)
        try {
            const result = await authService.setUserCompanies(
                selectedUser.id,
                selectedCompanyIds,
                allCompanies,
            )
            if (result.success) {
                toast.success("Branch access updated. The user must sign in again to apply changes.")
                setIsCompanyDialogOpen(false)
                fetchUsers(true)
            } else {
                toast.error(result.message)
            }
        } catch (error: any) {
            console.error(error)
            toast.error("Failed to update branch access")
        } finally {
            setIsAssigningCompanies(false)
        }
    }

    const openCompanyAssignment = async (user: User) => {
        setSelectedUser(user)
        setSelectedCompanyIds(
            (user.assignedCompanyIds ?? []).filter(
                (id) => id && id !== "00000000-0000-0000-0000-000000000000",
            ),
        )
        setIsCompanyDialogOpen(true)

        try {
            const userCompanies = await companyService.getUserCompanies(user.id)
            setSelectedCompanyIds(
                userCompanies
                    .map((c) => String(c.companyId))
                    .filter((id) => id && id !== "00000000-0000-0000-0000-000000000000"),
            )
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch assigned branches")
        }
    }

    const openLoginHistory = async (user: User) => {
        setSelectedUser(user)
        setLoginHistory([])
        setIsLoginHistoryOpen(true)
        setIsLoadingHistory(true)

        try {
            const rows = await authService.getUserLoginHistory(user.id)
            setLoginHistory(rows)
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch login history")
        } finally {
            setIsLoadingHistory(false)
        }
    }

    const columns: ColumnDef<User>[] = [
        {
            accessorKey: "fullName",
            header: "User Details",
            cell: ({ row }) => {
                const user = row.original
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {user.fullName ? user.fullName[0] : user.username[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{user.fullName || user.username}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "username",
            header: "Username",
        },
        {
            accessorKey: "roles",
            header: "Roles",
            cell: ({ row }) => {
                const roles = row.getValue("roles") as string[]
                return (
                    <div className="flex flex-wrap gap-1">
                                {roles.length > 0 ? roles.map(role => (
                                    <Badge key={role} variant="outline" className="text-[10px] py-0">
                                        {role}
                                    </Badge>
                                )) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                )}
                    </div>
                )
            }
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("isActive") as boolean
                return (
                    <Badge variant={isActive ? "default" : "destructive"} className="text-[10px]">
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const user = row.original
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <IconDotsVertical className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => {
                                        setSelectedUser(user)
                                        setTargetRole("")
                                        setIsRoleDialogOpen(true)
                                    }}
                                >
                                    Assign Role
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => openCompanyAssignment(user)}
                                >
                                    Branch Access
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => openLoginHistory(user)}
                                >
                                    Login History
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user)
                                    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                                    setPasswordError("")
                                    setIsPasswordDialogOpen(true)
                                }}>
                                    Change Password
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setSelectedUser(user)
                                        setEditForm({
                                            fullName: user.fullName || "",
                                            email: user.email,
                                            isActive: user.isActive
                                        })
                                        setIsEditDialogOpen(true)
                                    }}
                                >
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive opacity-50 pointer-events-none"
                                    disabled
                                    title="Delete user is not available in Auth API v1"
                                >
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            }
        }
    ]

    const stats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length,
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">System Users</h1>
                    <p className="text-sm text-muted-foreground">Manage user accounts and roles.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => fetchUsers(true)}
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
                        <IconUserPlus className="size-4 mr-2" />
                        Add User
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <UserStat label="Total Users" value={stats.total.toString()} />
                <UserStat label="Active" value={stats.active.toString()} />
                <UserStat label="Inactive" value={stats.inactive.toString()} />
                <UserStat label="Pending" value={users.filter(u => u.status === 0).length.toString()} />
            </div>

            <Card className="rounded-md">
                <DataTable
                    data={users.map(u => ({ ...u, accessState: u.status === 0 ? "pending" : u.isActive ? "true" : "false" }))}
                    columns={columns}
                    searchKey="fullName"
                    filterKey="accessState"
                    showTabs={true}
                    enableSelection={true}
                    enableDrag={true}
                    isLoading={isLoading || isRefreshing}
                    tabs={[
                        { label: "Active List", value: "true" },
                        { label: "Close List", value: "false" },
                        { label: "Pending List", value: "pending" },
                    ]}
                />
            </Card>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Username</Label>
                            <Input
                                value={createForm.username}
                                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Full Name</Label>
                            <Input
                                value={createForm.fullName}
                                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input
                                value={createForm.email}
                                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                type="email"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Password</Label>
                            <Input
                                value={createForm.password}
                                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                type="password"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Role</Label>
                            <NativeSelect
                                value={createForm.role}
                                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                            >
                                <option value="">Select a role</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.name}>{role.name}</option>
                                ))}
                            </NativeSelect>
                        </div>
                        {createForm.role && createForm.role !== "SuperAdmin" && (
                            <div className="grid gap-2">
                                <Label>Companies (required)</Label>
                                <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                                    {allCompanies.map((company) => (
                                        <div key={company.entityId} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`create-comp-${company.entityId}`}
                                                checked={selectedCompanyIds.includes(company.entityId)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedCompanyIds([...selectedCompanyIds, company.entityId])
                                                    } else {
                                                        setSelectedCompanyIds(
                                                            selectedCompanyIds.filter((id) => id !== company.entityId),
                                                        )
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`create-comp-${company.entityId}`} className="text-sm font-normal cursor-pointer">
                                                {company.companyNameEn}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateUser} disabled={isCreating}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Role Dialog */}
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Role</DialogTitle>
                        <DialogDescription>
                            Assigning replaces the user&apos;s full role set on the server. Current roles in this dialog are local only until the user list API exposes roles.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Current Roles</Label>
                            <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-10">
                                {(selectedUser?.roles ?? []).map(role => (
                                    <Badge key={role} variant="secondary" className="gap-1">
                                        {role}
                                        <button onClick={() => handleRemoveRole(role)}>
                                            <IconX className="size-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Add Role</Label>
                            <NativeSelect
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                            >
                                <option value="">Select a role</option>
                                {roles.filter(r => !(selectedUser?.roles ?? []).includes(r.name)).map(role => (
                                    <option key={role.id} value={role.name}>{role.name}</option>
                                ))}
                            </NativeSelect>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssignRole} disabled={isAssigning}>Assign</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Only account status can be changed via Auth API v1. Name and email are shown for reference.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Full Name</Label>
                            <Input
                                value={editForm.fullName}
                                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Status</Label>
                            <Switch
                                checked={editForm.isActive}
                                onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateUser} disabled={isUpdating}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the user account.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Company Assignment Dialog */}
            <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Branch Access Management</DialogTitle>
                        <DialogDescription>
                            Assign branches/companies that <b>{selectedUser?.fullName || selectedUser?.username}</b> can access.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                            {allCompanies.map(company => (
                                <div key={company.entityId} className="flex items-center space-x-3 p-3 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors">
                                    <Checkbox
                                        id={`comp-${company.entityId}`}
                                        checked={selectedCompanyIds.includes(company.entityId)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedCompanyIds([...selectedCompanyIds, company.entityId])
                                            } else {
                                                setSelectedCompanyIds(selectedCompanyIds.filter(id => id !== company.entityId))
                                            }
                                        }}
                                    />
                                    <Label htmlFor={`comp-${company.entityId}`} className="flex-1 cursor-pointer font-medium">
                                        {company.companyNameEn}
                                        <span className="block text-[10px] text-muted-foreground font-normal">
                                            {company.industry} • {company.registrationNo}
                                        </span>
                                    </Label>
                                </div>
                            ))}
                            {allCompanies.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground italic text-sm border-2 border-dashed rounded-lg">
                                    No companies found in the system.
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCompanyDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssignCompanies} disabled={isAssigningCompanies || allCompanies.length === 0}>
                            {isAssigningCompanies ? (
                                <>
                                    <IconLoader className="mr-2 size-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Assignments"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPasswordDialogOpen} onOpenChange={(open) => {
                if (isChangingPassword) return
                setIsPasswordDialogOpen(open)
                if (!open) {
                    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                    setPasswordError("")
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Change the password for {selectedUser?.fullName || selectedUser?.username}.
                            This signs the user out on all devices. Confirm with your own administrator password.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="administrator-current-password">Your administrator password</Label>
                            <Input id="administrator-current-password" type="password" autoComplete="current-password"
                                required maxLength={1024} disabled={isChangingPassword} value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-new-password">New password</Label>
                            <Input id="user-new-password" type="password" autoComplete="new-password"
                                required minLength={10} maxLength={128} disabled={isChangingPassword} value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                            <p className="text-xs text-muted-foreground">Use 10 to 128 characters, including uppercase, lowercase and a number.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-confirm-password">Confirm new password</Label>
                            <Input id="user-confirm-password" type="password" autoComplete="new-password"
                                required minLength={10} maxLength={128} disabled={isChangingPassword} value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
                        </div>
                        {passwordError && <p role="alert" className="text-sm text-destructive">{passwordError}</p>}
                        <DialogFooter>
                            <Button type="button" variant="outline" disabled={isChangingPassword} onClick={() => {
                                setIsPasswordDialogOpen(false)
                                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                                setPasswordError("")
                            }}>Cancel</Button>
                            <Button type="submit" disabled={isChangingPassword}>
                                {isChangingPassword && <IconLoader className="mr-2 size-4 animate-spin" />}
                                {isChangingPassword ? "Changing..." : "Change Password"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Login History Dialog */}
            <Dialog open={isLoginHistoryOpen} onOpenChange={setIsLoginHistoryOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Login History</DialogTitle>
                        <DialogDescription>
                            Recent sign-in activity for <b>{selectedUser?.fullName || selectedUser?.username}</b>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[420px] overflow-y-auto rounded-md border">
                        {isLoadingHistory ? (
                            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                                <IconLoader className="mr-2 size-4 animate-spin" />
                                Loading history...
                            </div>
                        ) : loginHistory.length > 0 ? (
                            <div className="divide-y">
                                {loginHistory.map(row => (
                                    <div key={row.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 p-3 text-sm">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={row.isSuccess ? "default" : "destructive"} className="text-[10px]">
                                                    {row.isSuccess ? "Success" : "Failed"}
                                                </Badge>
                                                <span className="font-medium">{new Date(row.loginAt).toLocaleString()}</span>
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {[row.browser, row.operatingSystem, row.deviceName].filter(Boolean).join(" / ") || "Unknown device"}
                                            </p>
                                            {row.failureReason ? (
                                                <p className="mt-1 text-xs text-destructive">{row.failureReason}</p>
                                            ) : null}
                                        </div>
                                        <div className="text-xs text-muted-foreground md:text-right">
                                            <div>{row.ipAddress || "No IP"}</div>
                                            <div>{row.macAddress || ""}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                No login history found.
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLoginHistoryOpen(false)}>Close</Button>
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

