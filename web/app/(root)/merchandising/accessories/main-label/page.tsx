import { redirect } from "next/navigation"

export default function MainLabelBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=MainLabel")
}
