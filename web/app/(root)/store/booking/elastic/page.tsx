"use client"

import BookingManagementPage from "../booking-manager"
import { StorePageShell, StoreCompanyGate } from "@/components/store"

export default function ElasticBookingPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => (
                    <BookingManagementPage
                        companyId={companyId}
                        bookingType="Elastic"
                        description="Allocate elastic supplies for knit and apparel production."
                        accentColor="rose"
                    />
                )}
            </StoreCompanyGate>
        </StorePageShell>
    )
}
