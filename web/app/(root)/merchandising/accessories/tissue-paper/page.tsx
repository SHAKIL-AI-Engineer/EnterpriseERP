import { redirect } from "next/navigation"

export default function TissuePaperBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=TissuePaper")
}
