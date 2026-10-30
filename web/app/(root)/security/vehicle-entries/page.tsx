"use client";

import * as React from "react";
import Link from "next/link";
import { IconPlus, IconEye } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SecurityPageShell,
  SecurityCompanyGate,
  InOutTimeDisplay,
  SecurityStatusBadge,
  SecurityDatePicker,
  SecurityDateTimePicker,
  todayIsoDate,
  nowDateTimeLocal,
} from "@/components/security";
import { securityService } from "@/lib/services/security";
import type { Gate, Vehicle, VehicleEntry } from "@/lib/types/security";

function toIso(value: string): string {
  return new Date(value).toISOString();
}

export default function VehicleEntriesPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <VehicleEntriesContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function VehicleEntriesContent({ companyId }: { companyId: string }) {
  const [date, setDate] = React.useState(() => todayIsoDate());
  const [entries, setEntries] = React.useState<VehicleEntry[]>([]);
  const [gates, setGates] = React.useState<Gate[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  const [form, setForm] = React.useState({
    gateId: "",
    vehicleId: "",
    entryNo: "",
    entryDate: todayIsoDate(),
    inTime: nowDateTimeLocal(),
    purpose: "",
    driverName: "",
    driverPhone: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [entryRows, gateRows, vehicleRows] = await Promise.all([
        securityService.getVehicleEntries(companyId, date),
        securityService.getGates(companyId),
        securityService.getVehicles(companyId),
      ]);
      setEntries(entryRows);
      setGates(gateRows.filter((g) => g.isActive));
      setVehicles(vehicleRows.filter((v) => v.isActive));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load vehicle entries");
    } finally {
      setLoading(false);
    }
  }, [companyId, date]);

  React.useEffect(() => {
    load();
  }, [load]);

  const gateMap = React.useMemo(
    () => new Map(gates.map((g) => [g.id, g])),
    [gates],
  );
  const vehicleMap = React.useMemo(
    () => new Map(vehicles.map((v) => [v.id, v])),
    [vehicles],
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gateId || !form.vehicleId || !form.entryNo) {
      toast.error("Gate, vehicle, and entry no are required");
      return;
    }
    setCreating(true);
    try {
      await securityService.createVehicleEntry({
        companyId,
        gateId: form.gateId,
        vehicleId: form.vehicleId,
        entryNo: form.entryNo,
        entryDate: form.entryDate,
        inTime: toIso(form.inTime),
        purpose: form.purpose || undefined,
        driverName: form.driverName || undefined,
        driverPhone: form.driverPhone || undefined,
      });
      toast.success("Vehicle checked in");
      setCreateOpen(false);
      load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to check in vehicle");
    } finally {
      setCreating(false);
    }
  };

  const prefillDriver = (vehicleId: string) => {
    const v = vehicles.find((x) => x.id === vehicleId);
    if (v) {
      setForm((f) => ({
        ...f,
        vehicleId,
        driverName: v.driverName ?? f.driverName,
        driverPhone: v.driverPhone ?? f.driverPhone,
      }));
    } else {
      setForm((f) => ({ ...f, vehicleId }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vehicle In / Out</h2>
          <p className="text-muted-foreground">Track vehicle gate entries and exits</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <IconPlus className="h-4 w-4" />
              Vehicle In
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Vehicle Check-In</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Gate</Label>
                <NativeSelect
                  value={form.gateId}
                  onChange={(e) => setForm((f) => ({ ...f, gateId: e.target.value }))}
                  required
                >
                  <option value="">Select gate</option>
                  {gates.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.gateName} ({g.gateCode})
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <NativeSelect
                  value={form.vehicleId}
                  onChange={(e) => prefillDriver(e.target.value)}
                  required
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNo}
                      {v.vehicleType ? ` · ${v.vehicleType}` : ""}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Entry No</Label>
                  <Input
                    value={form.entryNo}
                    onChange={(e) => setForm((f) => ({ ...f, entryNo: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Entry Date</Label>
                  <SecurityDatePicker
                    value={form.entryDate}
                    onChange={(entryDate) => setForm((f) => ({ ...f, entryDate }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>In Time</Label>
                <SecurityDateTimePicker
                  value={form.inTime}
                  onChange={(inTime) => setForm((f) => ({ ...f, inTime }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Input
                  value={form.purpose}
                  onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Driver Name</Label>
                  <Input
                    value={form.driverName}
                    onChange={(e) => setForm((f) => ({ ...f, driverName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Driver Phone</Label>
                  <Input
                    value={form.driverPhone}
                    onChange={(e) => setForm((f) => ({ ...f, driverPhone: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? "Checking in…" : "Check In"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <SecurityDatePicker
              value={date}
              onChange={setDate}
              className="w-52"
              placeholder="Filter date"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card/60">
        <CardContent className="pt-6">
          <div className="rounded-md border border-muted-foreground/10 overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Entry No</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>In / Out</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No vehicle entries for this date
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.entryNo}</TableCell>
                      <TableCell>
                        {vehicleMap.get(entry.vehicleId)?.vehicleNo ?? entry.vehicleId.slice(0, 8)}
                      </TableCell>
                      <TableCell>{gateMap.get(entry.gateId)?.gateName ?? "—"}</TableCell>
                      <TableCell>
                        <InOutTimeDisplay inTime={entry.inTime} outTime={entry.outTime} />
                      </TableCell>
                      <TableCell>
                        {entry.driverName ?? "—"}
                        {entry.driverPhone ? ` · ${entry.driverPhone}` : ""}
                      </TableCell>
                      <TableCell>
                        <SecurityStatusBadge status={entry.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/security/vehicle-entries/${entry.id}`}>
                            <IconEye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
