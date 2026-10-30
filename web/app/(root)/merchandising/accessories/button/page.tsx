import { redirect } from "next/navigation"

export default function ButtonBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=Button")
}
