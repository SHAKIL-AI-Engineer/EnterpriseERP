"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShipmentGatePassRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/security/gate-passes");
  }, [router]);

  return (
    <p className="p-6 text-sm text-muted-foreground">Redirecting to gate passes…</p>
  );
}
