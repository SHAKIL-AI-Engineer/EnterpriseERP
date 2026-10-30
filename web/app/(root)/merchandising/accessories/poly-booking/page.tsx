import { redirect } from "next/navigation"

export default function PolyBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=PolyBooking")
}
