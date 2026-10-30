"use client"

import { useEffect, useRef, useState } from "react"
import { IconUserCircle, IconMail, IconPhone, IconMapPin, IconBuilding, IconCheck, IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { authService, User, UserProfileUpdateDto, TwoFactorSetupResponse } from "@/lib/services/auth"
import { resolveProfilePictureUrl } from "@/lib/profile-picture"
import { toast } from "sonner"

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetupResponse | null>(null)
    const [twoFactorCode, setTwoFactorCode] = useState("")
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
    const [disableDialogOpen, setDisableDialogOpen] = useState(false)
    const [disableForm, setDisableForm] = useState({ password: "", code: "" })
    const [securityBusy, setSecurityBusy] = useState(false)
    const [profilePictureUrl, setProfilePictureUrl] = useState<string | undefined>()
    const [isUploadingPicture, setIsUploadingPicture] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [formData, setFormData] = useState<UserProfileUpdateDto>({
        fullName: "",
        email: "",
        phoneNumber: "",
        country: "",
        city: "",
        bio: "",
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const data = await authService.getProfile()
            setUser(data)
            setProfilePictureUrl(data.profilePictureUrl)
            setFormData({
                fullName: data.fullName || "",
                email: data.email || "",
                phoneNumber: data.phoneNumber || "",
                country: data.country || "",
                city: data.city || "",
                bio: data.bio || "",
            })
        } catch (error) {
            console.error("Failed to fetch profile:", error)
            toast.error("Failed to load profile data")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSaving(true)
            const result = await authService.updateProfile(formData)
            if (result.success) {
                toast.success("Profile updated successfully")
                if (result.user) {
                    setUser(result.user)
                    setProfilePictureUrl(result.user.profilePictureUrl)
                } else if (user) {
                    setUser({ ...user, ...formData })
                }
            } else {
                toast.error(result.message || "Failed to update profile")
            }
        } catch (error) {
            console.error("Update failed:", error)
            toast.error("An error occurred while saving changes")
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target
        setFormData(prev => ({ ...prev, [id]: value }))
    }

    const handlePictureSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ""
        if (!file) return
        setIsUploadingPicture(true)
        try {
            const { optimizeImageFile } = await import("@/lib/image-upload")
            const optimized = await optimizeImageFile(file, "avatar")
            const result = await authService.uploadProfilePicture(optimized)
            if (result.success && result.user) {
                setUser(result.user)
                setProfilePictureUrl(result.user.profilePictureUrl)
                toast.success("Profile picture updated")
            } else {
                toast.error(result.message)
            }
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to process image.")
        } finally {
            setIsUploadingPicture(false)
        }
    }

    const handleStartTwoFactor = async () => {
        try {
            setSecurityBusy(true)
            const setup = await authService.enableTwoFactor()
            setTwoFactorSetup(setup)
            setTwoFactorCode("")
            setRecoveryCodes([])
        } catch (error) {
            console.error(error)
            toast.error("Failed to start two-factor setup")
        } finally {
            setSecurityBusy(false)
        }
    }

    const handleVerifyTwoFactor = async () => {
        try {
            setSecurityBusy(true)
            const result = await authService.verifyTwoFactorSetup(twoFactorCode)
            setRecoveryCodes(result.recoveryCodes)
            toast.success("Two-factor authentication enabled")
            await fetchProfile()
        } catch (error) {
            console.error(error)
            toast.error("Invalid two-factor code")
        } finally {
            setSecurityBusy(false)
        }
    }

    const handleDisableTwoFactor = async () => {
        try {
            setSecurityBusy(true)
            const result = await authService.disableTwoFactor(disableForm.password, disableForm.code)
            if (result.success) {
                toast.success(result.message)
                setDisableDialogOpen(false)
                setDisableForm({ password: "", code: "" })
                await fetchProfile()
            } else {
                toast.error(result.message)
            }
        } finally {
            setSecurityBusy(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const initials = user?.fullName
        ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase()
        : "U"

    return (
        <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8">
            {/* Header Section with Gradient Background Effect */}
            <div className="relative rounded-3xl overflow-hidden bg-linear-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 p-8 border border-border/50">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <IconUserCircle size={200} />
                </div>
                <div className="relative flex flex-col md:flex-row gap-8 items-center md:items-start">
                    <div className="relative group">
                        <div className="relative">
                            <Avatar className="h-32 w-32 border-4 border-background rounded-full">
                                <AvatarImage
                                    src={resolveProfilePictureUrl(profilePictureUrl) ?? ""}
                                    alt={user?.fullName}
                                    className="rounded-full object-cover"
                                />
                                <AvatarFallback className="text-4xl font-bold bg-primary text-primary-foreground rounded-full">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handlePictureSelect}
                            />
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full text-xs"
                                disabled={isUploadingPicture}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {isUploadingPicture ? "..." : "Change photo"}
                            </Button>
                        </div>
                        <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1" variant={user?.isActive ? "default" : "destructive"}>
                            {user?.isActive ? "Active Account" : "Inactive"}
                        </Badge>
                    </div>
                    
                    <div className="text-center md:text-left space-y-2 pt-2">
                        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
                            {user?.fullName}
                        </h1>
                        <p className="text-xl text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
                            <Badge variant="secondary" className="font-semibold px-3 py-0.5">
                                {user?.roles?.join(", ") || "User"}
                            </Badge>
                            <span className="opacity-50">•</span>
                            <span className="text-sm font-normal">@{user?.username}</span>
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                            <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50 text-xs font-medium">
                                <IconMail className="h-3.5 w-3.5 text-primary" />
                                <span>{user?.email}</span>
                            </div>
                            {user?.phoneNumber && (
                                <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50 text-xs font-medium">
                                    <IconPhone className="h-3.5 w-3.5 text-primary" />
                                    <span>{user?.phoneNumber}</span>
                                </div>
                            )}
                            {(user?.city || user?.country) && (
                                <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50 text-xs font-medium">
                                    <IconMapPin className="h-3.5 w-3.5 text-primary" />
                                    <span>{[user?.city, user?.country].filter(Boolean).join(", ")}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="overflow-hidden border-none bg-card/50 backdrop-blur-sm">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IconBuilding className="h-5 w-5 text-primary" />
                                Assigned Access
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Roles</Label>
                                <div className="flex flex-wrap gap-1.5">
                                    {user?.roles?.map(role => (
                                        <Badge key={role} variant="outline" className="bg-primary/5 border-primary/20">
                                            {role}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <Separator className="opacity-50" />
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">User ID</Label>
                                <p className="text-xs font-mono bg-muted p-2 rounded border border-border/50 truncate">
                                    {user?.id}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-none bg-card/50 backdrop-blur-sm">
                        <CardHeader className="bg-blue-500/5 border-b border-blue-500/10">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IconCheck className="h-5 w-5 text-blue-500" />
                                Account Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">Two-Factor Auth</p>
                                    <p className="text-xs text-muted-foreground">{user?.twoFactorEnabled ? "Enabled" : "Not enabled"}</p>
                                </div>
                                {user?.twoFactorEnabled ? (
                                    <Button variant="outline" size="sm" onClick={() => setDisableDialogOpen(true)}>
                                        Disable
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={handleStartTwoFactor} disabled={securityBusy}>
                                        Enable
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Edit Form Card */}
                <Card className="lg:col-span-2 overflow-hidden border-none bg-card/30 backdrop-blur-md">
                    <CardHeader className="border-b border-border/50 bg-linear-to-r from-background to-background/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-bold">Profile Settings</CardTitle>
                                <CardDescription>Manage your public profile and contact information</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-sm font-semibold flex items-center gap-2">
                                        <IconUserCircle className="h-4 w-4 text-primary" />
                                        Full Name
                                    </Label>
                                    <Input 
                                        id="fullName" 
                                        placeholder="Your full name" 
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                                        <IconMail className="h-4 w-4 text-primary" />
                                        Email Address
                                    </Label>
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        placeholder="your@email.com" 
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber" className="text-sm font-semibold flex items-center gap-2">
                                        <IconPhone className="h-4 w-4 text-primary" />
                                        Phone Number
                                    </Label>
                                    <Input 
                                        id="phoneNumber" 
                                        placeholder="+1 (555) 000-0000" 
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city" className="text-sm font-semibold flex items-center gap-2">
                                        <IconMapPin className="h-4 w-4 text-primary" />
                                        City
                                    </Label>
                                    <Input 
                                        id="city" 
                                        placeholder="e.g. New York" 
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="country" className="text-sm font-semibold flex items-center gap-2">
                                        <IconMapPin className="h-4 w-4 text-primary" />
                                        Country
                                    </Label>
                                    <Input 
                                        id="country" 
                                        placeholder="e.g. United States" 
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <textarea
                                        id="bio"
                                        placeholder="Short professional bio (optional)"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex items-center justify-between border-t border-border/50">
                                <p className="text-xs text-muted-foreground italic">
                                    Last profile update: {new Date().toLocaleDateString()}
                                </p>
                                <Button 
                                    type="submit" 
                                    disabled={saving}
                                    className="px-8 bg-linear-to-r from-primary to-primary/80"
                                >
                                    {saving ? (
                                        <>
                                            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        "Save Profile Changes"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!twoFactorSetup} onOpenChange={(open) => !open && setTwoFactorSetup(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enable Two-Factor Auth</DialogTitle>
                        <DialogDescription>
                            Add this account to your authenticator app, then enter the generated code.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Setup Key</Label>
                            <p className="rounded-md border bg-muted p-3 font-mono text-xs break-all">
                                {twoFactorSetup?.sharedKey}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Authenticator URI</Label>
                            <p className="rounded-md border bg-muted p-3 font-mono text-xs break-all">
                                {twoFactorSetup?.otpAuthUri}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Verification Code</Label>
                            <Input
                                inputMode="numeric"
                                value={twoFactorCode}
                                onChange={(event) => setTwoFactorCode(event.target.value)}
                                placeholder="123456"
                            />
                        </div>
                        {recoveryCodes.length > 0 ? (
                            <div className="space-y-2">
                                <Label>Recovery Codes</Label>
                                <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted p-3 font-mono text-xs">
                                    {recoveryCodes.map(code => <span key={code}>{code}</span>)}
                                </div>
                            </div>
                        ) : null}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTwoFactorSetup(null)}>Close</Button>
                        <Button onClick={handleVerifyTwoFactor} disabled={securityBusy || !twoFactorCode || recoveryCodes.length > 0}>
                            Verify
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disable Two-Factor Auth</DialogTitle>
                        <DialogDescription>
                            Confirm your password and current authenticator code.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input
                                type="password"
                                value={disableForm.password}
                                onChange={(event) => setDisableForm(prev => ({ ...prev, password: event.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Two-factor code</Label>
                            <Input
                                inputMode="numeric"
                                value={disableForm.code}
                                onChange={(event) => setDisableForm(prev => ({ ...prev, code: event.target.value }))}
                                placeholder="123456"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDisableDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleDisableTwoFactor}
                            disabled={securityBusy || !disableForm.password || !disableForm.code}
                        >
                            Disable
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
