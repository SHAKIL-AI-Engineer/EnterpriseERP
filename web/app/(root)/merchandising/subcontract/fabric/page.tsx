"use client";

import { IconExchange } from "@tabler/icons-react";
import { MerchComingSoonPage } from "@/components/merchandising";

export default function SubContractFabricPage() {
  return (
    <MerchComingSoonPage
      icon={<IconExchange className="size-6" />}
      title="Sub-contract fabric"
      description="External dyeing, printing, and brushing workflows will connect when the subcontract module is available."
    />
  );
}
