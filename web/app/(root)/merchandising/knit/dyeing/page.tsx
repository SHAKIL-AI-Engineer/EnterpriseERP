"use client";

import { IconPalette } from "@tabler/icons-react";
import { MerchComingSoonPage } from "@/components/merchandising";

export default function DyeingMachinesPage() {
  return (
    <MerchComingSoonPage
      icon={<IconPalette className="size-6" />}
      title="Dyeing machines"
      description="Dyeing unit management will connect when the knit production service is available."
    />
  );
}
