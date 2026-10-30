"use client";

import * as React from "react";
import { IconPlus, IconDoor, IconSearch } from "@tabler/icons-react";
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
import type { Gate } from "@/lib/types/security";

export default function SecurityGatesPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <GatesContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function GatesContent({ companyId }: { companyId: string }) {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const readOnly = isViewerOnly(roles);

  const [gates, setGates] = React.useState<Gate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [editingGate, setEditingGate] = React.useState<Gate | null>(null);
  const [createForm, setCreateForm] = React.useState({
    gateCode: "",
    gateName: "",
    locationName: "",
  });
  const [editForm, setEditForm] = React.useState({
    gateCode: "",
    gateName: "",
    locationName: "",
    isActive: true,
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await securityService.getGates(companyId);
      setGates(rows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load gates");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = gates.filter((g) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      g.gateCode.toLowerCase().includes(q) ||
      g.gateName.toLowerCase().includes(q) ||
      (g.locationName?.toLowerCase().includes(q) ?? false)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.gateCode || !createForm.gateName) {
      toast.error("Gate code and name are required");
      return;
    }
    setCreating(true);
    try {
      await securityService.createGate({
        companyId,
        gateCode: createForm.gateCode,
        gateName: createForm.gateName,
        locationName: createForm.locationName || undefined,
      });
      toast.success("Gate created");
      setCreateOpen(false);
      setCreateForm({ gateCode: "", gateName: "", locationName: "" });
      load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create gate");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (gate: Gate) => {
    setEditingGate(gate);
    setEditForm({
      gateCode: gate.gateCode,
      gateName: gate.gateName,
      locationName: gate.locationName ?? "",
      isActive: gate.isActive,
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGate) return;
    setUpdating(true);
    try {
      await securityService.updateGate(
        editingGate.id,
        {
          gateCode: editForm.gateCode,
          gateName: editForm.gateName,
          locationName: editForm.locationName || undefined,
          isActive: editForm.isActive,
        },
        companyId,
      );
      toast.success("Gate updated");
      setEditOpen(false);
      setEditingGate(null);
      load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update gate");
    } finally {
      setUpdating(false);
    }
  };

  const toggleActive = async (gate: Gate, activate: boolean) => {
    setBusyId(gate.id);
    try {
      if (activate) {
        await securityService.activateGate(gate.id, companyId);
        toast.success("Gate activated");
      } else {
        await securityService.deactivateGate(gate.id, companyId);
        toast.success("Gate deactivated");
      }
      load();
    } catch (error) {
      console.error(error);
      toast.error(activate ? "Failed to activate gate" : "Failed to deactivate gate");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gate Setup</h2>
          <p className="text-muted-foreground">Manage entry and exit gates for the facility</p>
        </div>
        {!readOnly && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <IconPlus className="h-4 w-4" />
                Add Gate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>New Gate</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Gate Code</Label>
                    <Input
                      value={createForm.gateCode}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, gateCode: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Gate Name</Label>
                    <Input
                      value={createForm.gateName}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, gateName: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Location</Label>
                    <Input
                      value={createForm.locationName}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, locationName: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating…" : "Create Gate"}
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
              <IconDoor className="h-5 w-5 text-primary" />
              Gates
            </CardTitle>
            <div className="relative w-64">
              <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gates..."
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
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  {!readOnly && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={readOnly ? 4 : 5}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={readOnly ? 4 : 5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No gates found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((gate) => (
                    <TableRow key={gate.id}>
                      <TableCell className="font-medium font-mono">{gate.gateCode}</TableCell>
                      <TableCell>{gate.gateName}</TableCell>
                      <TableCell>{gate.locationName ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={gate.isActive ? "default" : "secondary"}>
                          {gate.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {!readOnly && (
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(gate)}
                          >
                            Edit
                          </Button>
                          {gate.isActive ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={busyId === gate.id}
                              onClick={() => toggleActive(gate, false)}
                            >
                              {busyId === gate.id ? "…" : "Deactivate"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={busyId === gate.id}
                              onClick={() => toggleActive(gate, true)}
                            >
                              {busyId === gate.id ? "…" : "Activate"}
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Gate</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Gate Code</Label>
                <Input
                  value={editForm.gateCode}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, gateCode: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Gate Name</Label>
                <Input
                  value={editForm.gateName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, gateName: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Location</Label>
                <Input
                  value={editForm.locationName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, locationName: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updating}>
                {updating ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
