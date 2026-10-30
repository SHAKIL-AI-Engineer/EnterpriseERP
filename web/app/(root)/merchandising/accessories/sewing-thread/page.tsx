import { redirect } from "next/navigation"

export default function SewingThreadBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=SewingThread")
}
