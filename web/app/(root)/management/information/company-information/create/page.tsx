"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconArrowLeft, IconBuilding, IconCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { toast } from "sonner"

import { companyService } from "@/lib/services/company"

export default function CreateCompanyPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        // Backend expects: CompanyNameEn, CompanyNameBn, Address, PhoneNumber, RegistrationNo, Industry, Email, Status, Founded, Logo, AuthorizeSignature

        try {
            await companyService.create(formData)
            toast.success("Company created successfully")
            router.push("/management/information/company-information")
        } catch (error: any) {
            console.error(error)
            const message = error.response?.data || "Failed to create company"
            toast.error(typeof message === 'string' ? message : "Failed to create company")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-3xl mx-auto w-full mb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <IconArrowLeft className="size-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <IconBuilding className="size-6 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">Add New Company</h1>
                </div>
            </div>

            <Card className="border-primary/10 shadow-lg">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Company Details</CardTitle>
                        <CardDescription>Enter the official information for the new company entity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="companyNameEn">Company Name (English)</Label>
                            <Input id="companyNameEn" name="companyNameEn" placeholder="e.g. Acme Hub Inc." required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="companyNameBn">Company Name (Bangla)</Label>
                            <Input id="companyNameBn" name="companyNameBn" placeholder="e.g. একমি হাব ইনক" className="font-sutonny text-lg" required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="addressEn">Company Address (English)</Label>
                            <Textarea id="addressEn" name="addressEn" placeholder="e.g. 123 Business Road, Dhaka" required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="addressBn">Company Address (Bangla)</Label>
                            <Textarea id="addressBn" name="addressBn" placeholder="e.g. ১২৩ বিজনেস রোড, ঢাকা" className="font-sutonny text-lg" required />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input id="phoneNumber" name="phoneNumber" placeholder="e.g. +880123456789" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Official Email</Label>
                                <Input id="email" name="email" type="email" placeholder="admin@company.com" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="registrationNo">Registration Number</Label>
                                <Input id="registrationNo" name="registrationNo" placeholder="REG-000-000" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="industry">Industry</Label>
                                <NativeSelect id="industry" name="industry" className="w-full">
                                    <option value="Garments">Garments</option>
                                    <option value="Dyeing">Dyeing</option>
                                    <option value="Knitting">Knitting</option>
                                </NativeSelect>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="founded">Year Founded</Label>
                                <Input id="founded" name="founded" type="number" defaultValue={new Date().getFullYear()} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Initial Status</Label>
                                <NativeSelect id="status" name="status" className="w-full" defaultValue="Active">
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Pending">Pending</option>
                                </NativeSelect>
                            </div>
                        </div>

                        <hr className="my-2" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="logo">Company Logo (Image)</Label>
                                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 bg-muted/30">
                                    <Input id="logo" name="logo" type="file" accept="image/*" className="cursor-pointer border-none shadow-none" />
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Max 2MB (JPG, PNG)</p>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="authorizeSignature">Authorize Signature (Image)</Label>
                                <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 bg-muted/30">
                                    <Input id="authorizeSignature" name="authorizeSignature" type="file" accept="image/*" className="cursor-pointer border-none shadow-none" />
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Max 2MB (JPG, PNG)</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 border-t pt-6 bg-muted/20">
                        <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : (
                                <span className="flex items-center gap-2">
                                    <IconCheck className="size-4" />
                                    Save Company
                                </span>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
