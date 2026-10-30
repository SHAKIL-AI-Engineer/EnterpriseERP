import { redirect } from "next/navigation"

export default function FabricBookingRedirectPage() {
    redirect("/merchandising/bookings?type=fabric")
}
