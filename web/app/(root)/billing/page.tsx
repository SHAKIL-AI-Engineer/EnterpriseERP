"use client"

import { IconCreditCard, IconReceipt, IconCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function BillingPage() {
    return (
        <div className="container mx-auto max-w-5xl py-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
                <p className="text-muted-foreground">Manage your plan, payment methods, and billing history.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Current Plan */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            Pro Plan
                            <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">Active</Badge>
                        </CardTitle>
                        <CardDescription>You are currently on the Pro tier.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-3xl font-bold">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                                <IconCheck className="h-4 w-4 text-green-500" />
                                <span>Unlimited Employees</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <IconCheck className="h-4 w-4 text-green-500" />
                                <span>Advanced Analytics</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <IconCheck className="h-4 w-4 text-green-500" />
                                <span>Priority Support</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full">Manage Subscription</Button>
                    </CardFooter>
                </Card>

                {/* Payment Method */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Method</CardTitle>
                        <CardDescription>Your default payment details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 border p-4 rounded-lg">
                            <div className="h-10 w-14 bg-muted rounded flex items-center justify-center">
                                <IconCreditCard className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Visa ending in 4242</p>
                                <p className="text-xs text-muted-foreground">Expires 12/28</p>
                            </div>
                            <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">Add Payment Method</Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Billing History */}
            <Card>
                <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>Recent invoices and receipts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 text-primary bg-primary/10 rounded-full flex items-center justify-center">
                                        <IconReceipt className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Invoice #INV-2024-00{i}</p>
                                        <p className="text-xs text-muted-foreground">Jan {30 - i}, 2024</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-medium">$29.00</span>
                                    <Button variant="ghost" size="sm">Download</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
