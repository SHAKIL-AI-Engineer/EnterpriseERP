import { Button } from "@/components/ui/button"
import Link from "next/link"
import { IconLock } from "@tabler/icons-react"

export default function UnauthorizedPage() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-muted/40">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                    <IconLock className="h-10 w-10 text-destructive" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">403</h1>
                <h2 className="text-2xl font-semibold tracking-tight">Access Denied</h2>
                <p className="text-muted-foreground max-w-[500px]">
                    You do not have permission to access this resource. Please contact your administrator if you believe this is a mistake.
                </p>
            </div>
            <div className="flex gap-2">
                <Button asChild variant="default">
                    <Link href="/">
                        Go to Dashboard
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/login">
                        Login as different user
                    </Link>
                </Button>
            </div>
        </div>
    )
}
