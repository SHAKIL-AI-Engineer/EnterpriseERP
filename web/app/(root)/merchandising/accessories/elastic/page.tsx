import { redirect } from "next/navigation"

export default function ElasticBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=Elastic")
}
