"use client";

import * as React from "react";
import { IconLayout, IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { CuttingPageShell, CuttingCompanyGate } from "@/components/cutting";
import { cuttingService } from "@/lib/services/cutting";
import type { CreateCuttingLaySizeDetailRequest, CuttingLay, CuttingPlan } from "@/lib/types/cutting";

export default function MarkerLayPlanningPage() {
  return (
    <CuttingPageShell>
      <CuttingCompanyGate>
        {(companyId) => <MarkerLayContent companyId={companyId} />}
      </CuttingCompanyGate>
    </CuttingPageShell>
  );
}

function MarkerLayContent({ companyId }: { companyId: string }) {
  const [lays, setLays] = React.useState<CuttingLay[]>([]);
  const [plans, setPlans] = React.useState<CuttingPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({
    cuttingPlanId: "",
    layNo: "",
    layDate: new Date().toISOString().slice(0, 10),
    markerNo: "",
    fabricLength: "",
    plyQty: "",
    layQty: "",
  });
  const [sizeLines, setSizeLines] = React.useState<CreateCuttingLaySizeDetailRequest[]>([
    { sizeName: "M", ratioQty: 1, plyQty: 1 },
  ]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [layRows, planRows] = await Promise.all([
        cuttingService.getLays(companyId),
        cuttingService.getPlans(companyId),
      ]);
      setLays(layRows);
      setPlans(planRows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load lays");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const planLabel = (planId: string) =>
    plans.find((p) => p.id === planId)?.planNo ?? planId.slice(0, 8);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cuttingPlanId || !form.layNo) {
      toast.error("Plan and lay number are required");
      return;
    }
    setCreating(true);
    try {
      await cuttingService.createLay({
        companyId,
        cuttingPlanId: form.cuttingPlanId,
        layNo: form.layNo,
        layDate: form.layDate,
        markerNo: form.markerNo || undefined,
        fabricLength: Number(form.fabricLength) || 0,
        plyQty: Number(form.plyQty) || 0,
        layQty: Number(form.layQty) || 0,
        sizeDetails: sizeLines.filter((s) => s.sizeName.trim()),
      });
      toast.success("Lay created");
      setCreateOpen(false);
      load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create lay");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marker & Lay Planning</h2>
          <p className="text-muted-foreground">
            Marker numbers and lay spreading records
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <IconPlus className="h-4 w-4" />
              New Lay
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Cutting Lay</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid gap-2">
                  <Label>Cutting Plan</Label>
                  <NativeSelect
                    value={form.cuttingPlanId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cuttingPlanId: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select plan</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.planNo}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Lay No</Label>
                    <Input
                      value={form.layNo}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, layNo: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Marker No</Label>
                    <Input
                      value={form.markerNo}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, markerNo: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Lay Date</Label>
                    <Input
                      type="date"
                      value={form.layDate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, layDate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Fabric Length</Label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={form.fabricLength}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, fabricLength: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Ply Qty</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.plyQty}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, plyQty: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Lay Qty</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.layQty}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, layQty: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Size details</Label>
                  {sizeLines.map((line, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        placeholder="Size"
                        value={line.sizeName}
                        onChange={(e) => {
                          const next = [...sizeLines];
                          next[i] = { ...next[i], sizeName: e.target.value };
                          setSizeLines(next);
                        }}
                        className="w-20"
                      />
                      <Input
                        type="number"
                        placeholder="Ratio"
                        value={line.ratioQty}
                        onChange={(e) => {
                          const next = [...sizeLines];
                          next[i] = {
                            ...next[i],
                            ratioQty: Number(e.target.value) || 0,
                          };
                          setSizeLines(next);
                        }}
                        className="w-20"
                      />
                      <Input
                        type="number"
                        placeholder="Ply"
                        value={line.plyQty}
                        onChange={(e) => {
                          const next = [...sizeLines];
                          next[i] = {
                            ...next[i],
                            plyQty: Number(e.target.value) || 0,
                          };
                          setSizeLines(next);
                        }}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={sizeLines.length === 1}
                        onClick={() =>
                          setSizeLines(sizeLines.filter((_, idx) => idx !== i))
                        }
                      >
                        <IconTrash className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSizeLines([
                        ...sizeLines,
                        { sizeName: "", ratioQty: 1, plyQty: 1 },
                      ])
                    }
                  >
                    Add size line
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating…" : "Create Lay"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconLayout className="h-5 w-5 text-indigo-500" />
            Cutting Lays
          </CardTitle>
          <CardDescription>Marker and lay records from cutting API</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading…</p>
          ) : lays.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No lays yet</p>
          ) : (
            <div className="space-y-4">
              {lays.map((lay) => (
                <div
                  key={lay.id}
                  className="p-4 rounded-xl border border-muted-foreground/10 bg-muted/20"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-sm">
                        {lay.layNo}
                        {lay.markerNo ? ` · Marker ${lay.markerNo}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Plan: {planLabel(lay.cuttingPlanId)} · {lay.layDate} · Ply{" "}
                        {lay.plyQty} · Lay qty {lay.layQty}
                      </p>
                    </div>
                    <Badge variant="outline">{lay.status}</Badge>
                  </div>
                  {lay.sizeDetails?.length > 0 && (
                    <Table className="mt-3">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Size</TableHead>
                          <TableHead className="text-right">Ratio</TableHead>
                          <TableHead className="text-right">Ply</TableHead>
                          <TableHead className="text-right">Cut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lay.sizeDetails.map((sd) => (
                          <TableRow key={sd.id}>
                            <TableCell>{sd.sizeName}</TableCell>
                            <TableCell className="text-right">{sd.ratioQty}</TableCell>
                            <TableCell className="text-right">{sd.plyQty}</TableCell>
                            <TableCell className="text-right">{sd.cutQty}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
