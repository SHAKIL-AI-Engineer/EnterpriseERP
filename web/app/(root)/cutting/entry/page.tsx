"use client";

import * as React from "react";
import { IconDeviceFloppy, IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
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
import { merchandisingService } from "@/lib/services/merchandising";
import type { CuttingLay, CuttingPlan } from "@/lib/types/cutting";
import type { Order } from "@/lib/types/merchandising";

type OutputLine = { sizeName: string; outputQty: string };

export default function CuttingEntryPage() {
  return (
    <CuttingPageShell>
      <CuttingCompanyGate>
        {(companyId) => <EntryContent companyId={companyId} />}
      </CuttingCompanyGate>
    </CuttingPageShell>
  );
}

function EntryContent({ companyId }: { companyId: string }) {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [plans, setPlans] = React.useState<CuttingPlan[]>([]);
  const [lays, setLays] = React.useState<CuttingLay[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [orderId, setOrderId] = React.useState("");
  const [cuttingPlanId, setCuttingPlanId] = React.useState("");
  const [cuttingLayId, setCuttingLayId] = React.useState("");
  const [outputDate, setOutputDate] = React.useState(
    new Date().toISOString().slice(0, 10),
  );
  const [colorName, setColorName] = React.useState("");
  const [lines, setLines] = React.useState<OutputLine[]>([
    { sizeName: "M", outputQty: "" },
  ]);

  React.useEffect(() => {
    merchandisingService
      .getOrders(companyId)
      .then(setOrders)
      .catch(() => toast.error("Failed to load orders"));
  }, [companyId]);

  React.useEffect(() => {
    if (!orderId) {
      setPlans([]);
      setCuttingPlanId("");
      return;
    }
    cuttingService
      .getPlans(companyId, orderId)
      .then(setPlans)
      .catch(() => toast.error("Failed to load plans"));
  }, [companyId, orderId]);

  React.useEffect(() => {
    if (!cuttingPlanId) {
      setLays([]);
      setCuttingLayId("");
      return;
    }
    cuttingService
      .getLays(companyId, cuttingPlanId)
      .then(setLays)
      .catch(() => toast.error("Failed to load lays"));
  }, [companyId, cuttingPlanId]);

  const handleSave = async () => {
    if (!orderId || !cuttingPlanId) {
      toast.error("Order and cutting plan are required");
      return;
    }
    const validLines = lines.filter(
      (l) => l.sizeName.trim() && Number(l.outputQty) > 0,
    );
    if (validLines.length === 0) {
      toast.error("Add at least one size line with quantity");
      return;
    }
    setSaving(true);
    try {
      for (const line of validLines) {
        await cuttingService.createOutput({
          companyId,
          orderId,
          cuttingPlanId,
          cuttingLayId: cuttingLayId || undefined,
          outputDate,
          colorName: colorName || undefined,
          sizeName: line.sizeName,
          outputQty: Number(line.outputQty),
        });
      }
      toast.success(`Saved ${validLines.length} output line(s)`);
      setLines([{ sizeName: "M", outputQty: "" }]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save cutting output");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cutting Entry</h2>
        <p className="text-muted-foreground">
          Record actual production output from the cutting floor
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Production Details</CardTitle>
              <CardDescription>Specify sizes and quantities cut in this batch</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Quantity (Pcs)</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          value={item.sizeName}
                          onChange={(e) => {
                            const next = [...lines];
                            next[i] = { ...next[i], sizeName: e.target.value };
                            setLines(next);
                          }}
                          className="h-9 w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          className="text-right h-9"
                          value={item.outputQty}
                          onChange={(e) => {
                            const next = [...lines];
                            next[i] = { ...next[i], outputQty: e.target.value };
                            setLines(next);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setLines(lines.filter((_, idx) => idx !== i))
                          }
                          disabled={lines.length === 1}
                        >
                          <IconTrash className="h-4 w-4 text-rose-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button
                variant="outline"
                className="w-full mt-4 border-dashed gap-2"
                onClick={() =>
                  setLines([...lines, { sizeName: "", outputQty: "" }])
                }
              >
                <IconPlus className="h-4 w-4" /> Add Line
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-card/60">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">
                Batch Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Order</Label>
                <NativeSelect
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value);
                    setCuttingPlanId("");
                  }}
                >
                  <option value="">Select order</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNo}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label>Cutting Plan</Label>
                <NativeSelect
                  value={cuttingPlanId}
                  onChange={(e) => {
                    setCuttingPlanId(e.target.value);
                    setCuttingLayId("");
                  }}
                  disabled={!orderId}
                >
                  <option value="">Select plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.planNo}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label>Lay (optional)</Label>
                <NativeSelect
                  value={cuttingLayId}
                  onChange={(e) => setCuttingLayId(e.target.value)}
                  disabled={!cuttingPlanId}
                >
                  <option value="">None</option>
                  {lays.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.layNo}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label>Cutting Date</Label>
                <Input
                  type="date"
                  value={outputDate}
                  onChange={(e) => setOutputDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="pt-4 border-t">
                <Button
                  className="w-full gap-2"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <IconDeviceFloppy className="h-4 w-4" />
                  {saving ? "Saving…" : "Save Batch Entry"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
