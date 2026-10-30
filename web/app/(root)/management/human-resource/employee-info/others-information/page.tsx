"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconLoader } from "@tabler/icons-react";

/** Redirect legacy route to employee edit (sub-resources are on HR detail/edit). */
export default function OthersInformationRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("id") ?? searchParams.get("employeeId");
    const companyId = searchParams.get("companyId");
    if (id && companyId) {
      router.replace(
        `/management/human-resource/employee-info/edit/${encodeURIComponent(id)}?companyId=${companyId}`,
      );
    } else {
      router.replace("/management/human-resource/employee-info");
    }
  }, [router, searchParams]);

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <IconLoader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
