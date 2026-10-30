import { redirect } from "next/navigation"

export default function DrawstringBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=Drawstring")
}
