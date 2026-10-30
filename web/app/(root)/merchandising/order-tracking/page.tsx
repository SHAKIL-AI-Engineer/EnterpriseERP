"use client";

import * as React from "react";
import {
  IconTimeline,
  IconRefresh,
  IconAlertTriangle,
  IconCalendarTime,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconLoader2,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchFilterCard,
  MerchFilterField,
  MerchTableCard,
} from "@/components/merchandising";
import { merchandisingService } from "@/lib/services/merchandising";
import type { Order, Buyer, Style, TnaCalendar } from "@/lib/types/merchandising";
import { cn } from "@/lib/utils";

type TrackedOrder = Order & {
  buyerName: string;
  styleNo: string;
};

function milestoneProgress(tna: TnaCalendar | null) {
  const milestones = tna?.milestones ?? [];
  if (milestones.length === 0) {
    return { pct: 0, label: "No TNA", status: "pending" as const };
  }
  const completed = milestones.filter(
    (m) => m.status === "Completed" || m.actualDate,
  ).length;
  const pct = Math.round((completed / milestones.length) * 100);
  const delayed = milestones.some((m) => m.status === "Delayed");
  return {
    pct,
    label: milestones.find((m) => !m.actualDate)?.milestoneName ?? "Complete",
    status: delayed
      ? ("delayed" as const)
      : pct >= 80
        ? ("on-track" as const)
        : ("at-risk" as const),
  };
}

export default function OrderTrackingPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <OrderTrackingPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}

function OrderTrackingPageContent({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [orders, setOrders] = React.useState<TrackedOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draftStatus, setDraftStatus] = React.useState("all");
  const [appliedStatus, setAppliedStatus] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [tnaCache, setTnaCache] = React.useState<Record<string, TnaCalendar | null>>({});
  const [tnaLoadingId, setTnaLoadingId] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const status = appliedStatus === "all" ? undefined : appliedStatus;
      const [ordersData, buyersData, stylesData] = await Promise.all([
        merchandisingService.getOrders(companyId, undefined, status),
        merchandisingService.getBuyers(companyId),
        merchandisingService.getStyles(companyId),
      ]);
      const buyerMap = new Map(buyersData.map((b) => [b.id, b.buyerName]));
      const styleMap = new Map(stylesData.map((s) => [s.id, s.styleNo]));
      setOrders(
        ordersData.map((order) => ({
          ...order,
          buyerName: buyerMap.get(order.buyerId) ?? "—",
          styleNo: styleMap.get(order.styleId) ?? "—",
        })),
      );
      setTnaCache({});
      setExpandedId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load tracking data");
    } finally {
      setLoading(false);
    }
  }, [companyId, appliedStatus]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadTna = async (orderId: string) => {
    if (tnaCache[orderId] !== undefined) return;
    try {
      setTnaLoadingId(orderId);
      const tna = await merchandisingService.getTnaByOrder(orderId);
      setTnaCache((prev) => ({ ...prev, [orderId]: tna }));
    } catch {
      setTnaCache((prev) => ({ ...prev, [orderId]: null }));
    } finally {
      setTnaLoadingId(null);
    }
  };

  const toggleExpand = (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    void loadTna(orderId);
  };

  const filtered = orders.filter(
    (o) =>
      o.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.styleNo.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const withProgress = filtered.map((o) => ({
    order: o,
    progress: milestoneProgress(
      expandedId === o.id || tnaCache[o.id] !== undefined
        ? (tnaCache[o.id] ?? null)
        : null,
    ),
  }));

  const kpiFrom = (ordersList: typeof filtered, getTna: (id: string) => TnaCalendar | null) => {
    let onTrack = 0;
    let atRisk = 0;
    let delayed = 0;
    for (const o of ordersList) {
      const p = milestoneProgress(getTna(o.id));
      if (p.status === "on-track") onTrack++;
      else if (p.status === "delayed") delayed++;
      else if (p.status === "at-risk") atRisk++;
    }
    return { onTrack, atRisk, delayed };
  };

  const { onTrack, atRisk, delayed } = kpiFrom(filtered, (id) => tnaCache[id] ?? null);

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconTimeline className="size-6" />}
        title="Order Tracking"
        description="TNA milestone monitoring — expand a row to load calendar"
        actions={
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <IconRefresh className="size-4" />
            Refresh
          </Button>
        }
      />

      <MerchFilterCard
        recordCount={filtered.length}
        onApply={() => setAppliedStatus(draftStatus)}
        onReset={() => {
          setDraftStatus("all");
          setAppliedStatus("all");
        }}
        isLoading={loading}
      >
        <MerchFilterField label="Status">
          <NativeSelect
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </NativeSelect>
        </MerchFilterField>
        <MerchFilterField label="Search" className="sm:col-span-2">
          <Input
            placeholder="Order, buyer, style…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </MerchFilterField>
      </MerchFilterCard>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi title="On-track" value={onTrack} icon={IconCheck} color="text-emerald-600" />
        <Kpi title="At risk" value={atRisk} icon={IconAlertTriangle} color="text-amber-600" />
        <Kpi title="Delayed" value={delayed} icon={IconCalendarTime} color="text-rose-600" />
        <Kpi title="Orders" value={filtered.length} icon={IconTimeline} color="text-blue-600" />
      </div>

      <MerchTableCard isLoading={loading}>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Milestone</TableHead>
              <TableHead className="text-center">Progress</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {withProgress.map(({ order, progress }) => {
              const isExpanded = expandedId === order.id;
              const tna = tnaCache[order.id];
              const displayProgress =
                isExpanded || tna !== undefined
                  ? milestoneProgress(tna ?? null)
                  : progress;
              return (
                <React.Fragment key={order.id}>
                  <TableRow className="cursor-pointer hover:bg-muted/20">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleExpand(order.id)}
                      >
                        {isExpanded ? (
                          <IconChevronDown className="size-4" />
                        ) : (
                          <IconChevronRight className="size-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell onClick={() => router.push(`/merchandising/orders/details/${order.id}`)}>
                      <div>
                        <span className="font-bold text-sm text-primary">{order.orderNo}</span>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {order.buyerName} · {order.styleNo}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {order.orderStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            displayProgress.status === "on-track"
                              ? "bg-emerald-500"
                              : displayProgress.status === "delayed"
                                ? "bg-rose-500"
                                : "bg-amber-500",
                          )}
                        />
                        <span className="text-xs font-medium">
                          {isExpanded || tna !== undefined
                            ? displayProgress.label
                            : "Expand to load TNA"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-32 mx-auto space-y-1">
                        <div className="text-[10px] font-bold text-right">
                          {isExpanded || tna !== undefined ? `${displayProgress.pct}%` : "—"}
                        </div>
                        <Progress
                          value={isExpanded || tna !== undefined ? displayProgress.pct : 0}
                          className="h-1"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/merchandising/orders/details/${order.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <IconChevronRight className="size-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-muted/10">
                      <TableCell colSpan={6} className="py-4">
                        {tnaLoadingId === order.id ? (
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <IconLoader2 className="size-4 animate-spin" />
                            Loading T&A…
                          </div>
                        ) : !tna ? (
                          <p className="text-sm text-muted-foreground text-center">
                            No T&A calendar.{" "}
                            <Link
                              href="/merchandising/ta-calendar"
                              className="text-primary underline"
                            >
                              Generate on T&A Calendar
                            </Link>
                          </p>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {(tna.milestones ?? [])
                              .slice()
                              .sort((a, b) => a.sequenceNo - b.sequenceNo)
                              .map((m) => (
                                <div
                                  key={m.id}
                                  className="rounded-lg border bg-background px-3 py-2 text-xs"
                                >
                                  <span className="font-semibold">{m.milestoneName}</span>
                                  <Badge variant="outline" className="ml-2 text-[9px]">
                                    {m.status}
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </MerchTableCard>
    </MerchPageShell>
  );
}

function Kpi({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
      <div className={cn("h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center", color)}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase">{title}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}
