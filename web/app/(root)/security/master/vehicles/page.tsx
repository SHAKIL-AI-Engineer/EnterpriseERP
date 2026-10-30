"use client";

import * as React from "react";
import { IconPlus, IconCar, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SecurityPageShell,
  SecurityCompanyGate,
  isViewerOnly,
} from "@/components/security";
import { useAuth } from "@/components/providers/auth-provider";
import { securityService } from "@/lib/services/security";
import type { Vehicle } from "@/lib/types/security";

export default function SecurityVehiclesPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <VehiclesContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function VehiclesContent({ companyId }: { companyId: string }) {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const readOnly = isViewerOnly(roles);

  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({
    vehicleNo: "",
    vehicleType: "",
    driverName: "",
    driverPhone: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await securityService.getVehicles(companyId);
      setVehicles(rows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = vehicles.filter((v) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      v.vehicleNo.toLowerCase().includes(q) ||
      (v.vehicleType?.toLowerCase().includes(q) ?? false) ||
      (v.driverName?.toLowerCase().includes(q) ?? false) ||
      (v.driverPhone?.toLowerCase().includes(q) ?? false)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleNo) {
      toast.error("Vehicle number is required");
      return;
    }
    setCreating(true);
    try {
      await securityService.createVehicle({
        companyId,
        vehicleNo: form.vehicleNo,
        vehicleType: form.vehicleType || undefined,
        driverName: form.driverName || undefined,
        driverPhone: form.driverPhone || undefined,
      });
      toast.success("Vehicle registered");
      setCreateOpen(false);
      setForm({ vehicleNo: "", vehicleType: "", driverName: "", driverPhone: "" });
      load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to register vehicle");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vehicle Registry</h2>
          <p className="text-muted-foreground">
            Master list of vehicles authorized for gate entry
          </p>
        </div>
        {!readOnly && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <IconPlus className="h-4 w-4" />
                Register Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>New Vehicle</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Vehicle No</Label>
                    <Input
                      value={form.vehicleNo}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, vehicleNo: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Vehicle Type</Label>
                    <Input
                      value={form.vehicleType}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, vehicleType: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Driver Name</Label>
                    <Input
                      value={form.driverName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, driverName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Driver Phone</Label>
                    <Input
                      value={form.driverPhone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, driverPhone: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Saving…" : "Register"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <IconCar className="h-5 w-5 text-primary" />
              Vehicles
            </CardTitle>
            <div className="relative w-64">
              <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-muted-foreground/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Vehicle No</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Driver Phone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No vehicles found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium font-mono">
                        {vehicle.vehicleNo}
                      </TableCell>
                      <TableCell>{vehicle.vehicleType ?? "—"}</TableCell>
                      <TableCell>{vehicle.driverName ?? "—"}</TableCell>
                      <TableCell>{vehicle.driverPhone ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={vehicle.isActive ? "default" : "secondary"}>
                          {vehicle.isActive ? "Active" : "Inactive"}
                        </Badge>
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
