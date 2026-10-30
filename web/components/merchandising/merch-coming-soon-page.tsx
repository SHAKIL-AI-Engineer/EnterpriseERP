"use client";

import { MerchEmptyState } from "@/components/merchandising/merch-empty-state";
import { MerchPageHeader } from "@/components/merchandising/merch-page-header";
import { MerchPageShell } from "@/components/merchandising/merch-page-shell";

type MerchComingSoonPageProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
};

export function MerchComingSoonPage({ icon, title, description }: MerchComingSoonPageProps) {
  return (
    <MerchPageShell>
      <MerchPageHeader icon={icon} title={title} description={description} />
      <MerchEmptyState variant="coming-soon" />
    </MerchPageShell>
  );
}
