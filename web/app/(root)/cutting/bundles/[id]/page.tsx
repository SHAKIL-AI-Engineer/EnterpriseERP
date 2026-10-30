"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { CuttingPageShell, CuttingCompanyGate } from "@/components/cutting";
import { cuttingService } from "@/lib/services/cutting";
import type { CuttingBundle } from "@/lib/types/cutting";

const BUNDLE_STATUSES = ["Ready", "Sent", "Review", "Cancelled"];

export default function BundleDetailPage() {
  return (
    <CuttingPageShell>
      <CuttingCompanyGate>
        {() => <BundleDetailContent />}
      </CuttingCompanyGate>
    </CuttingPageShell>
  );
}

function BundleDetailContent() {
  const params = useParams();
  const bundleId = typeof params.id === "string" ? params.id : "";

  const [bundle, setBundle] = React.useState<CuttingBundle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState("Ready");
  const [location, setLocation] = React.useState("");

  const load = React.useCallback(async () => {
    if (!bundleId) return;
    setLoading(true);
    try {
      const row = await cuttingService.getBundleById(bundleId);
      setBundle(row);
      setStatus(row.status);
      setLocation(row.currentLocation ?? "");
    } catch (error) {
      console.error(error);
      toast.error("Failed to load bundle");
    } finally {
      setLoading(false);
    }
  }, [bundleId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      const updated = await cuttingService.updateBundleStatus(bundleId, {
        status,
        currentLocation: location || undefined,
      });
      setBundle(updated);
      toast.success("Bundle status updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground py-10 text-center">Loading bundle…</p>;
  }

  if (!bundle) {
    return (
      <div className="text-center py-10 space-y-4">
        <p className="text-muted-foreground">Bundle not found</p>
        <Button variant="outline" asChild>
          <Link href="/cutting/bundles">Back to bundles</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cutting/bundles">
            <IconArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{bundle.bundleTag}</h2>
          <p className="text-sm text-muted-foreground">
            {bundle.sizeName} · {bundle.pieceCount} pcs
          </p>
        </div>
        <Badge variant="outline">{bundle.status}</Badge>
      </div>

      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader>
          <CardTitle>Bundle Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span>{bundle.planNo ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Style</span>
            <span>{bundle.styleName ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Serial range</span>
            <span>{bundle.serialRange ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Weight (kg)</span>
            <span>{bundle.weightKg ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location</span>
            <span>{bundle.currentLocation ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Status</Label>
            <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              {BUNDLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label>Current location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Floor / rack / line"
            />
          </div>
          <Button onClick={handleUpdateStatus} disabled={saving}>
            {saving ? "Saving…" : "Save Status"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
