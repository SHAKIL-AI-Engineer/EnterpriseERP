import { redirect } from "next/navigation"

export default function SolidTwillTapeBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=SolidTwillTape")
}
