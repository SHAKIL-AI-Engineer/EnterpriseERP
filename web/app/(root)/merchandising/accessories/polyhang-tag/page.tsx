import { redirect } from "next/navigation"

export default function PolyhangTagBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=PolyhangTag")
}
