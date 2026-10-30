"use client"

import BookingManagementPage from "../booking-manager"
import { StorePageShell, StoreCompanyGate } from "@/components/store"

export default function OthersBookingPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => (
                    <BookingManagementPage
                        companyId={companyId}
                        bookingType="Others"
                        description="Book miscellaneous materials and miscellaneous items."
                        accentColor="purple"
                    />
                )}
            </StoreCompanyGate>
        </StorePageShell>
    )
}
