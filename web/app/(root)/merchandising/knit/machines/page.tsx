"use client";

import { IconSettings } from "@tabler/icons-react";
import { MerchComingSoonPage } from "@/components/merchandising";

export default function KnitMachinesPage() {
  return (
    <MerchComingSoonPage
      icon={<IconSettings className="size-6" />}
      title="Knit machines"
      description="Knit machine registry will connect when the production knit module is available."
    />
  );
}
