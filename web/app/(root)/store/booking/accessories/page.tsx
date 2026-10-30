"use client"

import BookingManagementPage from "../booking-manager"
import { StorePageShell, StoreCompanyGate } from "@/components/store"

export default function AccessoriesBookingPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => (
                    <BookingManagementPage
                        companyId={companyId}
                        bookingType="Accessories"
                        description="Manage trim and accessory bookings for production orders."
                        accentColor="sky"
                    />
                )}
            </StoreCompanyGate>
        </StorePageShell>
    )
}
