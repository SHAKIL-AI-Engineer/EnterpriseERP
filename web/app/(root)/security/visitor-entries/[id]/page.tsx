"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IconArrowLeft, IconLogout, IconX } from "@tabler/icons-react";
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
import type { Gate, Visitor, VisitorEntry } from "@/lib/types/security";

function toIso(value: string): string {
  return new Date(value).toISOString();
}

export default function VisitorEntryDetailPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <VisitorEntryDetailContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function VisitorEntryDetailContent({ companyId }: { companyId: string }) {
  const params = useParams();
  const entryId = typeof params.id === "string" ? params.id : "";

  const [entry, setEntry] = React.useState<VisitorEntry | null>(null);
  const [visitor, setVisitor] = React.useState<Visitor | null>(null);
  const [gate, setGate] = React.useState<Gate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [checkoutOutTime, setCheckoutOutTime] = React.useState(() => nowDateTimeLocal());
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!entryId) return;
    setLoading(true);
    try {
      const entryRow = await securityService.getVisitorEntryById(entryId);
      const [visitorRow, gateRows] = await Promise.all([
        securityService.getVisitorById(entryRow.visitorId),
        securityService.getGates(companyId),
      ]);
      setEntry(entryRow);
      setVisitor(visitorRow);
      setGate(gateRows.find((g) => g.id === entryRow.gateId) ?? null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load visitor entry");
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, [entryId, companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleCheckout = async () => {
    if (!entry) return;
    setBusy(true);
    try {
      const updated = await securityService.checkoutVisitorEntry(entry.id, {
        outTime: toIso(checkoutOutTime),
      });
      setEntry(updated);
      setCheckoutOpen(false);
      toast.success("Visitor checked out");
    } catch (error) {
      console.error(error);
      toast.error("Failed to check out visitor");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!entry || !window.confirm("Cancel this visitor entry?")) return;
    setBusy(true);
    try {
      const updated = await securityService.cancelVisitorEntry(entry.id);
      setEntry(updated);
      toast.success("Entry cancelled");
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel entry");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground py-10 text-center">Loading visitor entry…</p>;
  }

  if (!entry) {
    return (
      <div className="text-center py-10 space-y-4">
        <p className="text-muted-foreground">Visitor entry not found</p>
        <Button variant="outline" asChild>
          <Link href="/security/visitor-entries">Back to list</Link>
        </Button>
      </div>
    );
  }

  const isCheckedIn = entry.status === "CheckedIn";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/security/visitor-entries">
              <IconArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{entry.entryNo}</h2>
            <p className="text-sm text-muted-foreground">
              {visitor?.visitorName ?? "Visitor"} · {entry.visitDate}
            </p>
          </div>
          <SecurityStatusBadge status={entry.status} />
        </div>
        {isCheckedIn && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-1"
              disabled={busy}
              onClick={() => {
                setCheckoutOutTime(nowDateTimeLocal());
                setCheckoutOpen(true);
              }}
            >
              <IconLogout className="h-4 w-4" />
              Check Out
            </Button>
            <Button size="sm" variant="destructive" disabled={busy} onClick={handleCancel}>
              <IconX className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader>
          <CardTitle>Entry Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Visitor" value={visitor?.visitorName} />
            <DetailRow label="Phone" value={visitor?.phone} />
            <DetailRow label="Company" value={visitor?.companyName} />
            <DetailRow label="Gate" value={gate ? `${gate.gateName} (${gate.gateCode})` : undefined} />
            <DetailRow label="Visit Date" value={entry.visitDate} />
            <DetailRow label="Card No" value={entry.visitorCardNo} />
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Purpose</p>
            <p>{entry.purpose}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">In / Out Times</p>
            <InOutTimeDisplay inTime={entry.inTime} outTime={entry.outTime} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Check Out</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Out Time</Label>
            <SecurityDateTimePicker
              value={checkoutOutTime}
              onChange={setCheckoutOutTime}
              placeholder="Out time"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={busy}>
              {busy ? "Checking out…" : "Confirm Check Out"}
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
