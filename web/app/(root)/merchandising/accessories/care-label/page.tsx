import { redirect } from "next/navigation"

export default function CareLabelBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=CareLabel")
}
