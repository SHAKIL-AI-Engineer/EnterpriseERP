"use client";

import { IconPackage } from "@tabler/icons-react";
import { MerchComingSoonPage } from "@/components/merchandising";

export default function YarnInventoryPage() {
  return (
    <MerchComingSoonPage
      icon={<IconPackage className="size-6" />}
      title="Yarn inventory"
      description="Yarn stock and lot tracking will connect when the knit inventory service is available."
    />
  );
}
