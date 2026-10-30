"use client"

import * as React from "react"
import {
    IconUser,
    IconLock,
    IconMail,
    IconBell,
    IconDeviceFloppy,
    IconPalette,
    IconCreditCard,
    IconUsers,
    IconKey,
    IconCloud,
    IconCheck,
    IconChevronRight,
    IconShieldLock,
    IconTrash,
    IconBellRinging,
    IconLayoutDashboard,
    IconWorld,
    IconLogout,
    IconLoader2
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { authService, User } from "@/lib/services/auth"
import { resolveProfilePictureUrl } from "@/lib/profile-picture"
import { useRouter } from "next/navigation"

const SETTINGS_GROUPS = [
    {
        title: "Personal",
        items: [
            { id: "profile", label: "Public Profile", icon: IconUser },
            { id: "account", label: "Account Settings", icon: IconLock },
            { id: "security", label: "Security", icon: IconShieldLock },
        ]
    },
    {
        title: "Preferences",
        items: [
            { id: "appearance", label: "Appearance", icon: IconPalette },
            { id: "notifications", label: "Notifications", icon: IconBellRinging },
            { id: "language", label: "Language", icon: IconWorld },
        ]
    },
    {
        title: "Workspace",
        items: [
            { id: "billing", label: "Plan & Billing", icon: IconCreditCard },
            { id: "team", label: "Team Management", icon: IconUsers },
            { id: "api", label: "Developer API", icon: IconKey },
        ]
    }
]

export default function SettingsPage() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState("profile")
    const { setTheme, theme } = useTheme()
    const router = useRouter() // Hook for navigation if needed

    // Profile State
    const [currentUser, setCurrentUser] = React.useState<User | null>(null)
    const [fullName, setFullName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [phoneNumber, setPhoneNumber] = React.useState("")
    const [country, setCountry] = React.useState("")
    const [city, setCity] = React.useState("")
    const [bio, setBio] = React.useState("")
    const [profilePictureUrl, setProfilePictureUrl] = React.useState<string | undefined>()
    const [isEmailEditable, setIsEmailEditable] = React.useState(false)
    const [isUploadingPicture, setIsUploadingPicture] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Password State
    const [passwordData, setPasswordData] = React.useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })
    const [isChangingPassword, setIsChangingPassword] = React.useState(false)

    React.useEffect(() => {
        const loadUser = async () => {
            try {
                const profile = await authService.getProfile();
                if (profile) {
                    setCurrentUser(profile);
                    setFullName(profile.fullName || "");
                    setEmail(profile.email || "");
                    setPhoneNumber(profile.phoneNumber || "");
                    setCountry(profile.country || "");
                    setCity(profile.city || "");
                    setBio(profile.bio || "");
                    setProfilePictureUrl(profile.profilePictureUrl);
                }
            } catch (error) {
                // Fallback to local storage if API fails
                const storedUser = authService.getCurrentUser();
                if (storedUser) {
                    setCurrentUser(storedUser);
                    setFullName(storedUser.fullName || "");
                }
            }
        }
        loadUser()
    }, [])


    const handleUpdateProfile = async () => {
        setIsLoading(true)
        try {
            // We use the new profile update endpoint
            const result = await authService.updateProfile({
                fullName,
                email,
                phoneNumber,
                country,
                city,
                bio,
            })

            if (result.success) {
                toast.success("Profile updated successfully")
                if (result.user) {
                    setCurrentUser(result.user)
                    setProfilePictureUrl(result.user.profilePictureUrl)
                } else {
                    setCurrentUser({ ...currentUser, fullName, email, phoneNumber, country, city, bio } as User)
                }
                setIsEmailEditable(false)
            } else {
                toast.error(result.message || "Failed to update profile")
            }

        } catch (error) {
            toast.error("An error occurred while updating profile")
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match")
            return
        }

        if (passwordData.newPassword.length < 10) {
            toast.error("Password must be at least 10 characters")
            return
        }

        setIsChangingPassword(true)
        try {
            const result = await authService.changePassword(passwordData)
            if (result.success) {
                toast.success("Password changed successfully")
                setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                })
            } else {
                toast.error(result.message || "Failed to change password")
            }
        } catch (error) {
            toast.error("An error occurred while changing password")
        } finally {
            setIsChangingPassword(false)
        }
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
                setProfilePictureUrl(result.user.profilePictureUrl)
                setCurrentUser(result.user)
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

    const handleRemovePicture = async () => {
        setIsUploadingPicture(true)
        try {
            const result = await authService.removeProfilePicture()
            if (result.success) {
                setProfilePictureUrl(undefined)
                if (result.user) setCurrentUser(result.user)
                toast.success("Profile picture removed")
            } else {
                toast.error(result.message)
            }
        } finally {
            setIsUploadingPicture(false)
        }
    }

    const avatarSrc = resolveProfilePictureUrl(profilePictureUrl)

    // Initials for avatar
    const initials = fullName
        ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "US"


    return (
        <div className="flex flex-col min-h-screen bg-background/50">
            {/* Header Area */}
            <div className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
                <div className="container mx-auto px-4 py-6 max-w-7xl">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            System Settings
                        </h1>
                        <p className="text-sm text-muted-foreground max-w-2xl">
                            Configure your personal experience and manage your organization's workspace preferences.
                        </p>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-10 mt-8">

                    {/* Sidebar Navigation */}
                    <aside className="lg:sticky lg:top-32 h-fit">
                        <TabsList scrollable={false} className="flex lg:flex-col h-auto bg-transparent p-0 gap-8 w-full justify-start overflow-x-auto lg:overflow-visible no-scrollbar pb-4 lg:pb-0">
                            {SETTINGS_GROUPS.map((group) => (
                                <div key={group.title} className="flex flex-col gap-2 min-w-max lg:min-w-0 w-full lg:w-auto">
                                    <h4 className="px-3 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mb-1 hidden lg:block">
                                        {group.title}
                                    </h4>
                                    <div className="flex lg:flex-col gap-1">
                                        {group.items.map((item) => (
                                            <TabsTrigger
                                                key={item.id}
                                                value={item.id}
                                                className={cn(
                                                    "w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-lg border border-transparent whitespace-nowrap lg:whitespace-normal",
                                                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                                                    "hover:bg-accent hover:text-accent-foreground"
                                                )}
                                            >
                                                <item.icon className="size-4 shrink-0" />
                                                <span>{item.label}</span>
                                            </TabsTrigger>
                                        ))}
                                    </div>
                                    <div className="lg:hidden w-px h-8 bg-border mx-2 self-center last:hidden" />
                                </div>
                            ))}
                        </TabsList>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 max-w-3xl space-y-12">

                        {/* 1. Profile Section */}
                        <TabsContent value="profile" className="focus-visible:outline-none space-y-8 m-0">
                            <SectionHeading
                                title="Public Profile"
                                description="Adjust your public identity and how you appear to others in the workspace."
                            />

                            <Card className="border-none bg-transparent shadow-none p-0">
                                <CardContent className="p-0 space-y-8">
                                    <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start bg-accent/30 p-8 rounded-2xl border border-accent">
                                        <div className="relative group">
                                            <Avatar className="size-32 border-[6px] border-background rounded-full transition-transform group-hover:scale-105">
                                                <AvatarImage src={avatarSrc ?? ""} className="rounded-full object-cover" />
                                                <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary rounded-full">{initials}</AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground size-8 rounded-full flex items-center justify-center border-4 border-background scale-0 group-hover:scale-100 transition-transform">
                                                <IconPalette className="size-3" />
                                            </div>
                                        </div>
                                        <div className="space-y-4 text-center sm:text-left">
                                            <div>
                                                <h4 className="text-lg font-semibold">Profile Avatar</h4>
                                                <p className="text-sm text-muted-foreground pr-4">Square images (JPG/PNG) work best. Max 2MB.</p>
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="hidden"
                                                onChange={handlePictureSelect}
                                            />
                                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                                <Button
                                                    size="sm"
                                                    className="rounded-full px-6"
                                                    disabled={isUploadingPicture}
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    {isUploadingPicture ? "Uploading..." : "Upload New"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive rounded-full px-6"
                                                    disabled={isUploadingPicture || !profilePictureUrl}
                                                    onClick={handleRemovePicture}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 px-6 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="fullname">Full Name</Label>
                                            <Input
                                                id="fullname"
                                                placeholder="John Doe"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="bio">Professional Bio</Label>
                                            <textarea
                                                id="bio"
                                                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                placeholder="Short professional bio (optional)"
                                            />
                                            <p className="text-[10px] text-muted-foreground italic">Markdown is supported for bios.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="grid gap-2">
                                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                                <Input
                                                    id="phoneNumber"
                                                    placeholder="+1 (555) 000-0000"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    className="h-11"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="city">City</Label>
                                                <Input
                                                    id="city"
                                                    placeholder="New York"
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    className="h-11"
                                                />
                                            </div>
                                            <div className="grid gap-2 md:col-span-2">
                                                <Label htmlFor="country">Country</Label>
                                                <Input
                                                    id="country"
                                                    placeholder="United States"
                                                    value={country}
                                                    onChange={(e) => setCountry(e.target.value)}
                                                    className="h-11"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2 text-sm">
                                            <Label>Contact Email</Label>
                                            <div className="flex items-center gap-2 p-1 rounded-md border border-dashed hover:border-solid hover:border-primary/50 transition-colors">
                                                <div className="p-2 bg-muted/50 rounded-md">
                                                    <IconMail className="size-4 text-muted-foreground" />
                                                </div>
                                                {isEmailEditable ? (
                                                    <Input
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="border-none shadow-none focus-visible:ring-0 h-auto p-0 px-2"
                                                        placeholder="admin@hrhub.com"
                                                    />
                                                ) : (
                                                    <span className="flex-1 px-2 text-muted-foreground font-medium">{email || "admin@hrhub.com"}</span>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 ml-auto mr-1"
                                                    onClick={() => setIsEmailEditable(!isEmailEditable)}
                                                >
                                                    {isEmailEditable ? <IconCheck className="size-4 text-green-500" /> : <span className="text-xs text-primary font-bold">Edit</span>}
                                                </Button>
                                            </div>
                                        </div>
                                        <Button onClick={() => handleUpdateProfile()} disabled={isLoading} className="w-full sm:w-auto min-w-[140px]">
                                            {isLoading && <span className="mr-2 animate-spin">⏳</span>}
                                            Save Changes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* 2. Appearance Section */}
                        <TabsContent value="appearance" className="focus-visible:outline-none space-y-8 m-0">
                            <SectionHeading
                                title="Appearance & Interface"
                                description="Choose your preferred visual theme and interface scale."
                            />

                            <div className="grid gap-8">
                                <div className="space-y-4">
                                    <Label className="text-base font-semibold">Theme Selection</Label>
                                    <RadioGroup
                                        onValueChange={setTheme}
                                        defaultValue={theme}
                                        className="grid grid-cols-1 sm:grid-cols-3 gap-6"
                                    >
                                        <ThemeCard value="light" activeTheme={theme} label="Light" />
                                        <ThemeCard value="dark" activeTheme={theme} label="Dark" />
                                        <ThemeCard value="system" activeTheme={theme} label="Auto" />
                                    </RadioGroup>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between p-4 rounded-xl border bg-accent/20">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Reduce Motion</Label>
                                        <p className="text-xs text-muted-foreground">Minimize animations for better performance.</p>
                                    </div>
                                    <Switch />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 3. Account / Security Section */}
                        <TabsContent value="account" className="focus-visible:outline-none space-y-10 m-0">
                            <SectionHeading
                                title="Account Settings"
                                description="Secure your access and manage your password credentials."
                            />

                            <div className="space-y-8">
                                <Card className="overflow-hidden border-2 transition-colors hover:border-primary/20">
                                    <form onSubmit={handlePasswordChange}>
                                        <CardHeader className="bg-muted/30">
                                            <CardTitle className="text-base">Change Password</CardTitle>
                                            <CardDescription>Update your login credentials regularly for better security.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-4 pb-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="currentPassword">Current Password</Label>
                                                <Input 
                                                    id="currentPassword" 
                                                    type="password" 
                                                    required 
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                                />
                                            </div>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="newPassword">New Password</Label>
                                                    <Input 
                                                        id="newPassword" 
                                                        type="password" 
                                                        required 
                                                        value={passwordData.newPassword}
                                                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="confirmPassword">Verify Password</Label>
                                                    <Input 
                                                        id="confirmPassword" 
                                                        type="password" 
                                                        required 
                                                        value={passwordData.confirmPassword}
                                                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="border-t bg-muted/20">
                                            <Button type="submit" size="sm" disabled={isChangingPassword}>
                                                {isChangingPassword ? (
                                                    <>
                                                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : "Update Securely"}
                                            </Button>
                                        </CardFooter>
                                    </form>
                                </Card>

                                <div className="p-6 rounded-2xl border-2 border-destructive/20 bg-destructive/5 space-y-4">
                                    <div className="flex items-center gap-4 text-destructive">
                                        <IconTrash className="size-8 p-1.5 rounded-full bg-destructive/10" />
                                        <div>
                                            <h4 className="text-lg font-bold">Danger Zone</h4>
                                            <p className="text-sm opacity-80 italic">Permanently remove all your data.</p>
                                        </div>
                                    </div>
                                    <Separator className="bg-destructive/10" />
                                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                        <p className="text-xs text-muted-foreground max-w-[400px]">
                                            Once you delete your account, there is no going back. Please be certain.
                                        </p>
                                        <Button variant="destructive" className="w-full sm:w-auto shadow-lg shadow-destructive/20">
                                            Delete My Account
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* 4. Billing / Workspace Section (Example of More Premium Cards) */}
                        <TabsContent value="billing" className="focus-visible:outline-none space-y-8 m-0">
                            <SectionHeading
                                title="Plan & Billing"
                                description="Manage your subscription tier and payment instruments."
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="relative overflow-hidden group border-2 border-primary/20 bg-primary/5">
                                    <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform">
                                        <IconCloud className="size-20 text-primary" />
                                    </div>
                                    <CardHeader>
                                        <Badge className="w-fit mb-2">Current Active</Badge>
                                        <CardTitle className="text-2xl font-black">PRO PLAN</CardTitle>
                                        <CardDescription>Billed annually @ $299/yr</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm">
                                            <PlanFeature label="Unlimited Team Members" />
                                            <PlanFeature label="Advanced Analytics" />
                                            <PlanFeature label="24/7 Priority Support" />
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="flex gap-2">
                                        <Button variant="secondary" className="flex-1">Manage Plan</Button>
                                        <Button variant="outline" size="icon"><IconChevronRight className="size-4" /></Button>
                                    </CardFooter>
                                </Card>

                                <Card className="border-2 border-dashed flex flex-col items-center justify-center p-8 text-center gap-4 bg-muted/10 opacity-60 hover:opacity-100 transition-opacity">
                                    <IconCreditCard className="size-12 text-muted-foreground" />
                                    <div>
                                        <h4 className="font-bold">Add Payment Method</h4>
                                        <p className="text-xs text-muted-foreground">Keep your subscription active</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="rounded-full">Link Card</Button>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Placeholder for other tabs */}
                        <TabsContent value="security" className="focus-visible:outline-none m-0">
                            <PlaceholderSection title="Security & Compliance" />
                        </TabsContent>
                        <TabsContent value="notifications" className="focus-visible:outline-none m-0">
                            <PlaceholderSection title="Communication Preferences" icon={IconBellRinging} />
                        </TabsContent>
                        <TabsContent value="language" className="focus-visible:outline-none m-0">
                            <PlaceholderSection title="Regional & Language" icon={IconWorld} />
                        </TabsContent>
                        <TabsContent value="team" className="focus-visible:outline-none m-0">
                            <PlaceholderSection title="Organization Management" icon={IconUsers} />
                        </TabsContent>
                        <TabsContent value="api" className="focus-visible:outline-none m-0">
                            <PlaceholderSection title="Developer Portal" icon={IconKey} />
                        </TabsContent>

                    </div>
                </Tabs>
            </main>

            {/* Sticky Mobile Navigation Footer (Alternative to horizontal tabs) */}
            <div className="lg:hidden sticky bottom-0 z-20 border-t bg-background/95 backdrop-blur-md px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><IconShieldLock className="size-3" /> Secure Session</span>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-tight">
                    <IconLogout className="size-3 mr-1" /> Logout Everywhere
                </Button>
            </div>
        </div>
    )
}

/* --- Components --- */

function SectionHeading({ title, description }: { title: string; description: string }) {
    return (
        <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
    )
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] bg-primary text-primary-foreground font-bold tracking-wider uppercase", className)}>
            {children}
        </span>
    )
}

function PlanFeature({ label }: { label: string }) {
    return (
        <li className="flex items-center gap-2">
            <IconCheck className="size-4 text-emerald-500" />
            <span>{label}</span>
        </li>
    )
}

function ThemeCard({ value, activeTheme, label }: { value: string; activeTheme?: string; label: string }) {
    return (
        <div className="space-y-2">
            <Label className={cn(
                "group relative block cursor-pointer rounded-xl border-4 transition-all overflow-hidden",
                activeTheme === value ? "border-primary ring-4 ring-primary/10" : "border-muted hover:border-accent"
            )}>
                <RadioGroupItem value={value} className="sr-only" />
                <div className={cn(
                    "h-24 p-3 space-y-2",
                    value === 'light' ? "bg-slate-100" : value === 'dark' ? "bg-slate-900" : "bg-linear-to-br from-slate-100 to-slate-900"
                )}>
                    <div className="flex gap-1.5">
                        <div className="size-2 rounded-full bg-muted-foreground/30" />
                        <div className="size-2 rounded-full bg-muted-foreground/30" />
                    </div>
                    <div className="space-y-1.5">
                        <div className="h-1.5 w-full rounded bg-muted-foreground/20" />
                        <div className="h-1.5 w-[80%] rounded bg-muted-foreground/20" />
                    </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-background/90 backdrop-blur-sm p-1.5 text-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                    Select
                </div>
            </Label>
            <p className="text-center text-xs font-medium text-muted-foreground">{label}</p>
        </div>
    )
}

function PlaceholderSection({ title, icon: Icon = IconLayoutDashboard }: { title: string; icon?: any }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-3xl bg-accent/10 text-center p-12 space-y-4">
            <div className="p-4 rounded-full bg-background shadow-xl">
                <Icon className="size-12 text-primary" />
            </div>
            <div className="space-y-1">
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    This section is currently under development. Enhanced controls and more granular settings are coming soon.
                </p>
            </div>
            <Button variant="outline" className="rounded-full">Request Feature</Button>
        </div>
    )
}
