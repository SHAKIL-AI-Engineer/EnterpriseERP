"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconLoader } from "@tabler/icons-react";

/** Legacy separation flow replaced by HR employee status API. */
export default function SeparationRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/management/human-resource/separations");
  }, [router]);

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <IconLoader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
