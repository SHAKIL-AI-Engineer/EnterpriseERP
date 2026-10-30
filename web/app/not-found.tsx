"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconHome, IconSearch } from "@tabler/icons-react"

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
            <div className="relative mb-8">
                <h1 className="text-9xl font-black text-muted-foreground/10 select-none">404</h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <IconSearch className="size-20 text-primary animate-pulse" />
                </div>
            </div>

            <h2 className="text-3xl font-bold tracking-tight mb-2">Page Not Found</h2>
            <p className="text-muted-foreground max-w-md mb-8">
                Oops! The page you are looking for doesn&apos;t exist or has been moved.
                Let&apos;s get you back on track.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="rounded-full px-8">
                    <Link href="/">
                        <IconHome className="mr-2 size-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-8" onClick={() => window.history.back()}>
                    Go Back
                </Button>
            </div>
        </div>
    )
}
