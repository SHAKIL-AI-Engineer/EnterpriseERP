import { redirect } from "next/navigation"

export default function SideLabelBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=SideLabel")
}
