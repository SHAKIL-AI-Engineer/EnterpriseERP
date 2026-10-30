"use client"

import BookingManagementPage from "../booking-manager"
import { StorePageShell, StoreCompanyGate } from "@/components/store"

export default function PolyBookingPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => (
                    <BookingManagementPage
                        companyId={companyId}
                        bookingType="Poly"
                        description="Reserve poly-bags and packaging materials."
                        accentColor="emerald"
                    />
                )}
            </StoreCompanyGate>
        </StorePageShell>
    )
}
