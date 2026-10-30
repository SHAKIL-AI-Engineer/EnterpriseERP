"use client"

import BookingManagementPage from "../booking-manager"
import { StorePageShell, StoreCompanyGate } from "@/components/store"

export default function ZipperBookingPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => (
                    <BookingManagementPage
                        companyId={companyId}
                        bookingType="Zipper"
                        description="Manage zipper allocations and puller requirements."
                        accentColor="amber"
                    />
                )}
            </StoreCompanyGate>
        </StorePageShell>
    )
}
