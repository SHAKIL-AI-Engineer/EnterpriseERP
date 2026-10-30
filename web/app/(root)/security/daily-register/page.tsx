"use client";

import * as React from "react";
import { IconCalendar, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  SecurityStatusBadge,
  InOutTimeDisplay,
  SecurityDatePicker,
  todayIsoDate,
} from "@/components/security";
import { securityService } from "@/lib/services/security";
import type { DailyGateRegister } from "@/lib/types/security";

export default function DailyRegisterPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <DailyRegisterContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function DailyRegisterContent({ companyId }: { companyId: string }) {
  const [date, setDate] = React.useState(() => todayIsoDate());
  const [register, setRegister] = React.useState<DailyGateRegister | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await securityService.getDailyRegister(companyId, date);
      setRegister(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load daily register");
      setRegister(null);
    } finally {
      setLoading(false);
    }
  }, [companyId, date]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
            <IconCalendar className="size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daily Register</h1>
            <p className="text-sm text-muted-foreground">
              Consolidated gate activity for a selected date.
            </p>
          </div>
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Date</Label>
          <SecurityDatePicker
            className="w-[200px]"
            value={date}
            onChange={setDate}
            placeholder="Select date"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : !register ? (
        <p className="text-muted-foreground text-center py-12">No register data for this date.</p>
      ) : (
        <Tabs defaultValue="visitors" className="w-full">
          <TabsList>
            <TabsTrigger value="visitors">
              Visitors ({register.visitors?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="vehicles">
              Vehicles ({register.vehicles?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="gatePasses">
              Gate passes ({register.gatePasses?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visitors" className="mt-4">
            <RegisterTable
              empty="No visitor entries"
              headers={["Entry no", "Purpose", "In / out", "Status"]}
              rows={(register.visitors ?? []).map((v) => ({
                key: v.id,
                cells: [
                  v.entryNo,
                  v.purpose,
                  <InOutTimeDisplay key="t" inTime={v.inTime} outTime={v.outTime} />,
                  <SecurityStatusBadge key="s" status={v.status} />,
                ],
              }))}
            />
          </TabsContent>

          <TabsContent value="vehicles" className="mt-4">
            <RegisterTable
              empty="No vehicle entries"
              headers={["Entry no", "Driver", "In / out", "Status"]}
              rows={(register.vehicles ?? []).map((v) => ({
                key: v.id,
                cells: [
                  v.entryNo,
                  v.driverName || "—",
                  <InOutTimeDisplay key="t" inTime={v.inTime} outTime={v.outTime} />,
                  <SecurityStatusBadge key="s" status={v.status} />,
                ],
              }))}
            />
          </TabsContent>

          <TabsContent value="gatePasses" className="mt-4">
            <RegisterTable
              empty="No gate passes"
              headers={["Pass no", "Type", "Direction", "Status"]}
              rows={(register.gatePasses ?? []).map((g) => ({
                key: g.id,
                cells: [
                  g.gatePassNo,
                  g.gatePassType,
                  g.direction,
                  <SecurityStatusBadge key="s" status={g.status} />,
                ],
              }))}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function RegisterTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: { key: string; cells: React.ReactNode[] }[];
  empty: string;
}) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {headers.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length} className="text-center py-8 text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.key}>
                {row.cells.map((cell, i) => (
                  <TableCell key={i}>{cell}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
