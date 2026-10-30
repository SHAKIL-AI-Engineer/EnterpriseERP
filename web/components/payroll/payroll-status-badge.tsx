import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Approved: "default",
  Processed: "default",
  Pending: "secondary",
  Draft: "outline",
  Rejected: "destructive",
  Locked: "destructive",
  Open: "outline",
};

export function PayrollStatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANT[status] ?? "outline";
  return <Badge variant={variant}>{status}</Badge>;
}
