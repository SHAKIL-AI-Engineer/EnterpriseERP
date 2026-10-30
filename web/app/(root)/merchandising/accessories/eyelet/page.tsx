import { redirect } from "next/navigation"

export default function EyeletBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=Eyelet")
}
