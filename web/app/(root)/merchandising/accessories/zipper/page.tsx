import { redirect } from "next/navigation"

export default function ZipperBookingRedirectPage() {
    redirect("/merchandising/bookings?type=trims&subType=Zipper")
}
