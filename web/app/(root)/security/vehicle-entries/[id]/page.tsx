"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IconArrowLeft, IconLogout } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SecurityPageShell,
  SecurityCompanyGate,
  InOutTimeDisplay,
  SecurityStatusBadge,
  SecurityDateTimePicker,
  nowDateTimeLocal,
} from "@/components/security";
import { securityService } from "@/lib/services/security";
import type { Gate, Vehicle, VehicleEntry } from "@/lib/types/security";

function toIso(value: string): string {
  return new Date(value).toISOString();
}

export default function VehicleEntryDetailPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <VehicleEntryDetailContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function VehicleEntryDetailContent({ companyId }: { companyId: string }) {
  const params = useParams();
  const entryId = typeof params.id === "string" ? params.id : "";

  const [entry, setEntry] = React.useState<VehicleEntry | null>(null);
  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
  const [gate, setGate] = React.useState<Gate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [exitOpen, setExitOpen] = React.useState(false);
  const [outTime, setOutTime] = React.useState(() => nowDateTimeLocal());
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!entryId) return;
    setLoading(true);
    try {
      const [allEntries, gateRows, vehicleRows] = await Promise.all([
        securityService.getVehicleEntries(companyId),
        securityService.getGates(companyId),
        securityService.getVehicles(companyId),
      ]);
      const row = allEntries.find((e) => e.id === entryId) ?? null;
      if (!row) {
        setEntry(null);
        return;
      }
      setEntry(row);
      setGate(gateRows.find((g) => g.id === row.gateId) ?? null);
      setVehicle(vehicleRows.find((v) => v.id === row.vehicleId) ?? null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load vehicle entry");
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, [entryId, companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleExit = async () => {
    if (!entry) return;
    setBusy(true);
    try {
      const updated = await securityService.exitVehicleEntry(entry.id, {
        outTime: toIso(outTime),
      });
      setEntry(updated);
      setExitOpen(false);
      toast.success("Vehicle exited");
    } catch (error) {
      console.error(error);
      toast.error("Failed to record vehicle exit");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground py-10 text-center">Loading vehicle entry…</p>;
  }

  if (!entry) {
    return (
      <div className="text-center py-10 space-y-4">
        <p className="text-muted-foreground">Vehicle entry not found</p>
        <Button variant="outline" asChild>
          <Link href="/security/vehicle-entries">Back to list</Link>
        </Button>
      </div>
    );
  }

  const isInside = entry.status === "In";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/security/vehicle-entries">
              <IconArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{entry.entryNo}</h2>
            <p className="text-sm text-muted-foreground">
              {vehicle?.vehicleNo ?? "Vehicle"} · {entry.entryDate}
            </p>
          </div>
          <SecurityStatusBadge status={entry.status} />
        </div>
        {isInside && (
          <Button
            size="sm"
            className="gap-1"
            disabled={busy}
            onClick={() => {
              setOutTime(nowDateTimeLocal());
              setExitOpen(true);
            }}
          >
            <IconLogout className="h-4 w-4" />
            Record Exit
          </Button>
        )}
      </div>

      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader>
          <CardTitle>Entry Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Vehicle No" value={vehicle?.vehicleNo} />
            <DetailRow label="Vehicle Type" value={vehicle?.vehicleType} />
            <DetailRow label="Gate" value={gate ? `${gate.gateName} (${gate.gateCode})` : undefined} />
            <DetailRow label="Entry Date" value={entry.entryDate} />
            <DetailRow label="Driver Name" value={entry.driverName} />
            <DetailRow label="Driver Phone" value={entry.driverPhone} />
          </div>
          {entry.purpose && (
            <div>
              <p className="text-muted-foreground mb-1">Purpose</p>
              <p>{entry.purpose}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground mb-1">In / Out Times</p>
            <InOutTimeDisplay inTime={entry.inTime} outTime={entry.outTime} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Vehicle Exit</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Out Time</Label>
            <SecurityDateTimePicker
              value={outTime}
              onChange={setOutTime}
              placeholder="Out time"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExitOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExit} disabled={busy}>
              {busy ? "Saving…" : "Confirm Exit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}
