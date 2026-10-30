import { redirect } from "next/navigation"

export default function PriceTagBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=PriceTag")
}
