import { redirect } from "next/navigation"

export default function DrawcordBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=Drawcord")
}
