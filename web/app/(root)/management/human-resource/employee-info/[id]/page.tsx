"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
    IconUser,
    IconMail,
    IconPhone,
    IconCalendar,
    IconBriefcase,
    IconMapPin,
    IconUsers,
    IconBuildingBank,
    IconPhoneCall,
    IconArrowLeft,
    IconEdit,
    IconCircleCheckFilled,
    IconClock,
    IconLoader
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { employeeService, type Employee } from "@/lib/services/employee"
import { EmployeeHistoryPanel } from "@/components/hr/employee-history-panel"
import { StatusChangeSheet } from "@/components/hr/status-change-sheet"
import { TransferSheet } from "@/components/hr/transfer-sheet"
import { toast } from "sonner"
import { format } from "date-fns"
import { EmployeeDocumentsPanel } from "@/components/hr/employee-documents-panel"
import { EmployeeProfileImageLightbox } from "@/components/hr/employee-profile-image-lightbox"

export default function EmployeeDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const id = params.id as string
    const companyIdParam = searchParams.get("companyId")
    const companyIdInt = companyIdParam ? parseInt(companyIdParam) : 0

    const [employee, setEmployee] = React.useState<Employee | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [statusOpen, setStatusOpen] = React.useState(false)
    const [transferOpen, setTransferOpen] = React.useState(false)
    const [employeeOptions, setEmployeeOptions] = React.useState<
        import("@/lib/services/employee").EmployeeSimple[]
    >([])

    React.useEffect(() => {
        if (!id || !companyIdInt) return
        const fetchEmployee = async () => {
            try {
                const data = await employeeService.getEmployee(id, companyIdInt)
                setEmployee(data)
                if (data.entityId) {
                    setEmployeeOptions([
                        {
                            id: data.id,
                            entityId: data.entityId,
                            employeeId: data.employeeId,
                            punchNumber: data.punchNumber,
                            fullNameEn: data.fullNameEn,
                            companyId: data.companyId,
                            companyEntityId: data.companyEntityId,
                        },
                    ])
                }
            } catch (error) {
                toast.error("Failed to load employee details")
                router.push("/management/human-resource/employee-info")
            } finally {
                setIsLoading(false)
            }
        }
        fetchEmployee()
    }, [id, companyIdInt, router])

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <IconLoader className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!employee) return null

    return (
        <div className="p-4 md:p-8 space-y-8 w-full">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
                    <IconArrowLeft className="h-4 w-4" />
                    Back to List
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStatusOpen(true)}>
                        Change status
                    </Button>
                    <Button variant="outline" onClick={() => setTransferOpen(true)}>
                        Transfer
                    </Button>
                    <Button className="gap-2" onClick={() => router.push(`/management/human-resource/employee-info/edit/${id}?companyId=${companyIdInt}`)}>
                        <IconEdit className="h-4 w-4" />
                        Edit Profile
                    </Button>
                </div>
            </div>

            {/* Profile Header Card */}
            <Card className="overflow-hidden border-none shadow-xl bg-linear-to-br from-white to-gray-50">
                <div className="h-32 bg-primary/10 relative">
                    <div className="absolute -bottom-16 left-8 flex items-end gap-6">
                        <EmployeeProfileImageLightbox
                            imageUrl={employee.profileImageUrl}
                            name={employee.fullNameEn}
                            subtitle={
                                [employee.designationName, employee.departmentName]
                                    .filter(Boolean)
                                    .join(" · ") || undefined
                            }
                        />
                        <div className="pb-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{employee.fullNameEn}</h1>
                                <Badge variant="outline" className="flex items-center gap-1.5 h-7 px-3 bg-white/50 backdrop-blur-sm border-primary/20 text-primary font-semibold">
                                    {employee.status === "Active" ? <IconCircleCheckFilled className="h-3.5 w-3.5" /> : <IconClock className="h-3.5 w-3.5" />}
                                    {employee.status}
                                </Badge>
                            </div>
                            <p className="text-lg font-medium text-muted-foreground mt-1 flex items-center gap-2">
                                <IconBriefcase className="h-4 w-4" />
                                {employee.designationName}
                                {employee.designationName && employee.departmentName ? " · " : null}
                                {employee.departmentName}
                            </p>
                        </div>
                    </div>
                </div>
                <CardContent className="pt-20 pb-8 px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        <InfoStat label="Employee ID" value={employee.employeeId} icon={IconUser} />
                        <InfoStat label="Joining Date" value={format(new Date(employee.joinDate), "dd MMM yyyy")} icon={IconCalendar} />
                        <InfoStat label="Phone" value={employee.phoneNumber || "N/A"} icon={IconPhone} />
                        <InfoStat label="Email" value={employee.email || "N/A"} icon={IconMail} />
                    </div>
                </CardContent>
            </Card>

            {/* Details Tabs */}
            <Tabs defaultValue="personal" className="w-full">
                <TabsList className="bg-muted/50 p-1 h-12 w-fit mb-6">
                    <TabsTrigger value="personal" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Personal</TabsTrigger>
                    <TabsTrigger value="employment" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Employment</TabsTrigger>
                    <TabsTrigger value="salary" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Salary & Bank</TabsTrigger>
                    <TabsTrigger value="emergency" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Emergency</TabsTrigger>
                    <TabsTrigger value="documents" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Documents</TabsTrigger>
                    <TabsTrigger value="history" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">History</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm shadow-black/5">
                            <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><IconUser className="h-5 w-5" />Basic Information</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <DetailItem label="Full Name (Bangla)" value={employee.fullNameBn} />
                                <DetailItem label="NID Number" value={employee.nid} />
                                <DetailItem label="Date of Birth" value={employee.dateOfBirth ? format(new Date(employee.dateOfBirth), "dd MMM yyyy") : "N/A"} />
                                <DetailItem label="Gender" value={employee.gender} />
                                <DetailItem label="Punch number" value={employee.punchNumber} />
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm shadow-black/5">
                            <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><IconMapPin className="h-5 w-5" />Address Information</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Present Address</p>
                                    <p className="text-sm border-l-2 border-primary/20 pl-4 py-1 leading-relaxed text-gray-700 italic">{employee.presentAddress || "Not Provided"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Permanent Address</p>
                                    <p className="text-sm border-l-2 border-primary/20 pl-4 py-1 leading-relaxed text-gray-700 italic">{employee.permanentAddress || "Not Provided"}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="employment" className="space-y-6">
                    <Card className="border-none shadow-sm shadow-black/5">
                        <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><IconBriefcase className="h-5 w-5" />Work Organization</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <DetailItem label="Company Name" value={employee.companyName} />
                                <DetailItem label="Department" value={employee.departmentName} />
                                <DetailItem label="Section" value={employee.sectionName} />
                                <DetailItem label="Designation" value={employee.designationName} />
                                <DetailItem label="Shift" value={employee.shiftName} />
                                <DetailItem label="Status" value={employee.status} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="salary" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm shadow-black/5">
                            <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><IconBuildingBank className="h-5 w-5" />Salary Structure</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Gross Salary</p>
                                    <p className="text-2xl font-black text-primary">à§³ {(employee.grossSalary || 0).toLocaleString()}</p>
                                </div>
                                <div className="space-y-4">
                                    <DetailItem label="Basic Salary" value={`à§³ ${(employee.basicSalary || 0).toLocaleString()}`} />
                                    <DetailItem label="House Rent" value={`à§³ ${(employee.houseRent || 0).toLocaleString()}`} />
                                    <DetailItem label="Medical Allowance" value={`à§³ ${(employee.medicalAllowance || 0).toLocaleString()}`} />
                                </div>
                                <div className="space-y-4">
                                    <DetailItem label="Conveyance" value={`à§³ ${(employee.conveyance || 0).toLocaleString()}`} />
                                    <DetailItem label="Food Allowance" value={`à§³ ${(employee.foodAllowance || 0).toLocaleString()}`} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm shadow-black/5">
                            <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><IconBuildingBank className="h-5 w-5" />Bank Account Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <DetailItem label="Bank Name" value={employee.bankName} />
                                <DetailItem label="Account Type" value={employee.bankAccountType} />
                                <DetailItem label="Account Number" value={employee.bankAccountNo} />
                                <DetailItem label="Routing Number" value={employee.bankRoutingNo} />
                                <DetailItem label="Branch Name" value={employee.bankBranchName} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="emergency" className="space-y-6">
                    <Card className="border-none shadow-sm shadow-black/5">
                        <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><IconPhoneCall className="h-5 w-5" />Emergency contact</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem label="Name" value={employee.emergencyContactName} />
                            <DetailItem label="Relation" value={employee.emergencyContactRelation} />
                            <DetailItem label="Phone" value={employee.emergencyContactPhone} />
                            <DetailItem label="Address" value={employee.emergencyContactAddress} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents">
                    {employee.entityId ? (
                        <EmployeeDocumentsPanel
                            employeeEntityId={employee.entityId}
                            documents={employee.documents ?? []}
                            onChanged={() =>
                                employeeService.getEmployee(id, companyIdInt).then(setEmployee)
                            }
                        />
                    ) : null}
                </TabsContent>

                <TabsContent value="history">
                    {employee.entityId ? (
                        <EmployeeHistoryPanel
                            employeeId={employee.entityId}
                            companyId={companyIdInt || undefined}
                        />
                    ) : null}
                </TabsContent>
            </Tabs>

            {employee.entityId ? (
                <>
                    <StatusChangeSheet
                        open={statusOpen}
                        onOpenChange={setStatusOpen}
                        employeeId={employee.entityId}
                        employeeName={employee.fullNameEn}
                        companyId={companyIdInt || undefined}
                        onSuccess={() => {
                            employeeService
                                .getEmployee(id, companyIdInt)
                                .then(setEmployee)
                        }}
                    />
                    <TransferSheet
                        open={transferOpen}
                        onOpenChange={setTransferOpen}
                        employees={employeeOptions}
                        companyId={companyIdInt || undefined}
                        defaultEmployeeEntityId={employee.entityId}
                        onSuccess={() => {
                            employeeService
                                .getEmployee(id, companyIdInt)
                                .then(setEmployee)
                        }}
                    />
                </>
            ) : null}
        </div>
    )
}

interface InfoStatProps {
    label: string;
    value: string | number | null | undefined;
    icon: React.ElementType;
}

function InfoStat({ label, value, icon: Icon }: InfoStatProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
            <p className="text-sm font-bold text-gray-900">{value}</p>
        </div>
    )
}

function DetailItem({ label, value }: { label: string, value: string | number | null | undefined }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-gray-800">
                {value !== undefined && value !== null && String(value).trim() !== "" ? value : "—"}
            </p>
        </div>
    )
}
