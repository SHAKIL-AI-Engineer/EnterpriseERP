"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShipmentVehicleRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/security/vehicle-entries");
  }, [router]);
  return <p className="p-6 text-sm text-muted-foreground">Redirecting to vehicle entries…</p>;
}
