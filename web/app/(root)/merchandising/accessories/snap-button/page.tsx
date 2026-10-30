import { redirect } from "next/navigation"

export default function SnapButtonBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=SnapButton")
}
