"use client"

import * as React from "react"
import {
    IconSearch,
    IconHelp,
    IconBook,
    IconMessageCircle,
    IconMail,
    IconDeviceDesktopAnalytics,
    IconUsers,
    IconBuildingFactory2,
    IconPackages,
    IconChevronRight
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export default function HelpCenterPage() {
    const [searchQuery, setSearchQuery] = React.useState("")

    const categories = [
        { title: "Human Resources", icon: IconUsers, description: "Employee management, payroll, and attendance guides.", count: 12 },
        { title: "Production", icon: IconBuildingFactory2, description: "Tracking operations, daily reports, and output targets.", count: 8 },
        { title: "Store & Inventory", icon: IconPackages, description: "Managing stock, material issues, and receipts.", count: 5 },
        { title: "Reports & Analytics", icon: IconDeviceDesktopAnalytics, description: "Understanding dashboards and exporting data.", count: 10 },
    ]

    const faqs = [
        { question: "How do I reset my password?", answer: "Go to Account Settings > Security and click on 'Reset Password'. Follow the email instructions." },
        { question: "Can I export reports to Excel?", answer: "Yes, all data tables have an 'Export' button in the top right corner provided you have the necessary permissions." },
        { question: "How to add a new employee?", answer: "Navigate to HR > Employee List and click the '+ Add Employee' button. Fill in the required details." },
        { question: "Why is the production dashboard not updating?", answer: "The dashboard updates in real-time. If you see discrepancies, try refreshing the page or checking your internet connection." },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-muted/30">
            {/* Hero Section */}
            <div className="bg-primary px-6 py-16 md:px-12 md:py-24 text-center">
                <div className="mx-auto max-w-3xl space-y-6">
                    <h1 className="text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl md:text-5xl">
                        How can we help you today?
                    </h1>
                    <p className="text-lg text-primary-foreground/80">
                        Search for documentation, guides, or contact our support team.
                    </p>
                    <div className="relative mx-auto max-w-xl">
                        <IconSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="h-12 w-full rounded-full border-0 bg-white pl-12 pr-4 shadow-lg text-foreground focus-visible:ring-0 placeholder:text-muted-foreground"
                            placeholder="Search for articles (e.g., 'payroll', 'targets')..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-6xl px-4 py-12 md:px-6">

                {/* Categories */}
                <div className="mb-12">
                    <h2 className="mb-6 text-xl font-bold tracking-tight">Browse Topics</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {categories.map((category) => (
                            <Card key={category.title} className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
                                <CardHeader>
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                        <category.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                                    </div>
                                    <CardTitle className="text-lg">{category.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>{category.description}</CardDescription>
                                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                                        View {category.count} articles <IconChevronRight className="ml-1 h-4 w-4" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* FAQs */}
                <div className="grid gap-12 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <h2 className="mb-6 text-xl font-bold tracking-tight">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <Card key={index} className="overflow-hidden">
                                    <CardHeader className="bg-muted/50 py-4">
                                        <div className="flex items-center gap-3">
                                            <IconHelp className="h-5 w-5 text-primary" />
                                            <h3 className="font-semibold">{faq.question}</h3>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="py-4">
                                        <p className="text-muted-foreground">{faq.answer}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Contact Side */}
                    <div className="space-y-6">
                        <Card className="bg-primary text-primary-foreground">
                            <CardHeader>
                                <CardTitle>Still need help?</CardTitle>
                                <CardDescription className="text-primary-foreground/80">
                                    Our support team is available 24/7 to assist you.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button variant="secondary" className="w-full justify-start gap-2" size="lg">
                                    <IconMessageCircle className="h-4 w-4" />
                                    Start Live Chat
                                </Button>
                                <Button variant="secondary" className="w-full justify-start gap-2" size="lg">
                                    <IconMail className="h-4 w-4" />
                                    Send Email
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <IconBook className="h-5 w-5" />
                                    Documentation
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-sm">
                                    <li><a href="#" className="flex items-center text-muted-foreground hover:text-primary hover:underline">Getting Started Guide</a></li>
                                    <li><a href="#" className="flex items-center text-muted-foreground hover:text-primary hover:underline">API Reference</a></li>
                                    <li><a href="#" className="flex items-center text-muted-foreground hover:text-primary hover:underline">Release Notes</a></li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
