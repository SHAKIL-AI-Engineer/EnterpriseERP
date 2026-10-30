"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { IconBuilding, IconChevronLeft, IconCircleCheckFilled, IconLoader, IconPhoto } from "@tabler/icons-react"
import { toast } from "sonner"
import { companyService, Company } from "@/lib/services/company"
import { getPublicApiOrigin } from "@/lib/api-base"

export default function EditCompanyPage() {
    const router = useRouter()
    const params = useParams()
    const companyId = typeof params.id === "string" ? params.id : (params.id as string[] | undefined)?.[0] ?? ""

    const [isLoading, setIsLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)
    const [company, setCompany] = React.useState<Company | null>(null)

    const apiOrigin = getPublicApiOrigin()

    React.useEffect(() => {
        const fetchCompany = async () => {
            try {
                const data = await companyService.getById(companyId)
                setCompany(data)
            } catch (error) {
                console.error(error)
                toast.error("Failed to fetch company details")
                router.push("/management/information/company-information")
            } finally {
                setIsLoading(false)
            }
        }
        if (companyId) {
            fetchCompany()
        }
    }, [companyId, router])

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)

        const formData = new FormData(e.currentTarget)

        try {
            await companyService.update(companyId, formData)
            toast.success("Company information updated successfully")
            router.push("/management/information/company-information")
        } catch (error: any) {
            console.error(error)
            const message = error.response?.data || "Failed to update company"
            toast.error(typeof message === 'string' ? message : "Failed to update company")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <IconLoader className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!company) return null

    return (
        <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 max-w-4xl mx-auto mb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <IconChevronLeft className="size-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit &quot;{company.companyNameEn}&quot;</h1>
                    <p className="text-muted-foreground text-sm">Update the company details and configuration.</p>
                </div>
            </div>

            <form onSubmit={handleSave}>
                <Card className="shadow-lg border-muted/40 overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-8 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <IconBuilding className="size-5 text-primary" />
                            Company Details
                        </CardTitle>
                        <CardDescription>Modify the registration and contact information for this company.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-8 px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="companyNameEn">Company Name (English)</Label>
                                <Input
                                    id="companyNameEn"
                                    name="companyNameEn"
                                    placeholder="Enter company name"
                                    defaultValue={company.companyNameEn}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyNameBn">Company Name (Bangla)</Label>
                                <Input
                                    id="companyNameBn"
                                    name="companyNameBn"
                                    placeholder="Enter company name"
                                    defaultValue={company.companyNameBn}
                                    className="font-sutonny text-lg"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="addressEn">Company Address (English)</Label>
                            <Textarea
                                id="addressEn"
                                name="addressEn"
                                placeholder="e.g. 123 Business Road, Dhaka"
                                defaultValue={company.addressEn}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="addressBn">Company Address (Bangla)</Label>
                            <Textarea
                                id="addressBn"
                                name="addressBn"
                                placeholder="e.g. ১২৩ বিজনেস রোড, ঢাকা"
                                defaultValue={company.addressBn}
                                className="font-sutonny text-lg"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    placeholder="e.g. +880123456789"
                                    defaultValue={company.phoneNumber}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Official Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="contact@company.com"
                                    defaultValue={company.email}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="registrationNo">Registration Number</Label>
                                <Input
                                    id="registrationNo"
                                    name="registrationNo"
                                    placeholder="REG-123456"
                                    defaultValue={company.registrationNo}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <NativeSelect
                                    id="industry"
                                    name="industry"
                                    className="w-full"
                                    defaultValue={company.industry}
                                >
                                    <option value="Garments">Garments</option>
                                    <option value="Dyeing">Dyeing</option>
                                    <option value="Knitting">Knitting</option>
                                </NativeSelect>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="founded">Founded Year</Label>
                                <Input
                                    id="founded"
                                    name="founded"
                                    placeholder="e.g. 2020"
                                    defaultValue={company.founded}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <NativeSelect
                                    id="status"
                                    name="status"
                                    className="w-full"
                                    defaultValue={company.status}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Inactive">Inactive</option>
                                </NativeSelect>
                            </div>
                        </div>

                        <hr className="my-2" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label>Company Logo</Label>
                                <div className="flex items-start gap-4">
                                    <div className="size-24 rounded-xl border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                                        {company.logoPath ? (
                                            <img src={company.logoPath.startsWith("http") ? company.logoPath : `${apiOrigin}${company.logoPath}`} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <IconPhoto className="size-8 text-muted-foreground/40" />
                                        )}
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <Input id="logo" name="logo" type="file" accept="image/*" className="text-xs" />
                                        <p className="text-[10px] text-muted-foreground">Upload new logo to replace existing one.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label>Authorize Signature</Label>
                                <div className="flex items-start gap-4">
                                    <div className="size-24 rounded-xl border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                                        {company.authorizeSignaturePath ? (
                                            <img src={company.authorizeSignaturePath.startsWith("http") ? company.authorizeSignaturePath : `${apiOrigin}${company.authorizeSignaturePath}`} alt="Signature" className="w-full h-full object-contain" />
                                        ) : (
                                            <IconPhoto className="size-8 text-muted-foreground/40" />
                                        )}
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <Input id="authorizeSignature" name="authorizeSignature" type="file" accept="image/*" className="text-xs" />
                                        <p className="text-[10px] text-muted-foreground">Upload new signature image.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/10 border-t px-8 py-6 flex justify-end gap-3">
                        <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="min-w-[140px] bg-[#108545] hover:bg-[#0d6e39] text-white">
                            {isSaving ? (
                                <>
                                    <IconLoader className="mr-2 size-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <IconCircleCheckFilled className="mr-2 size-4" />
                                    Update Company
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
