"use client";

import * as React from "react";
import { IconPlus, IconUsers, IconSearch } from "@tabler/icons-react";
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
import type { Visitor } from "@/lib/types/security";

export default function SecurityVisitorsPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <VisitorsContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function VisitorsContent({ companyId }: { companyId: string }) {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const readOnly = isViewerOnly(roles);

  const [visitors, setVisitors] = React.useState<Visitor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [phoneSearch, setPhoneSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [blacklistId, setBlacklistId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    visitorName: "",
    phone: "",
    nidNo: "",
    companyName: "",
    address: "",
  });

  const load = React.useCallback(
    async (phone?: string) => {
      setLoading(true);
      try {
        const rows = await securityService.getVisitors(
          companyId,
          phone?.trim() || undefined,
        );
        setVisitors(rows);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load visitors");
      } finally {
        setLoading(false);
      }
    },
    [companyId],
  );

  React.useEffect(() => {
    load();
  }, [load]);

  const handlePhoneSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(phoneSearch);
  };

  const filtered = visitors.filter((v) => {
    const q = phoneSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (v.phone?.toLowerCase().includes(q) ?? false) ||
      v.visitorName.toLowerCase().includes(q) ||
      (v.companyName?.toLowerCase().includes(q) ?? false) ||
      (v.nidNo?.toLowerCase().includes(q) ?? false)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitorName) {
      toast.error("Visitor name is required");
      return;
    }
    setCreating(true);
    try {
      await securityService.createVisitor({
        companyId,
        visitorName: form.visitorName,
        phone: form.phone || undefined,
        nidNo: form.nidNo || undefined,
        companyName: form.companyName || undefined,
        address: form.address || undefined,
      });
      toast.success("Visitor registered");
      setCreateOpen(false);
      setForm({
        visitorName: "",
        phone: "",
        nidNo: "",
        companyName: "",
        address: "",
      });
      load(phoneSearch);
    } catch (error) {
      console.error(error);
      toast.error("Failed to register visitor");
    } finally {
      setCreating(false);
    }
  };

  const handleBlacklist = async (visitor: Visitor) => {
    if (visitor.isBlacklisted) {
      toast.info("Visitor is already blacklisted");
      return;
    }
    setBlacklistId(visitor.id);
    try {
      await securityService.blacklistVisitor(visitor.id);
      toast.success("Visitor blacklisted");
      load(phoneSearch);
    } catch (error) {
      console.error(error);
      toast.error("Failed to blacklist visitor");
    } finally {
      setBlacklistId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Visitor Registry</h2>
          <p className="text-muted-foreground">
            Master list of visitors for check-in and security screening
          </p>
        </div>
        {!readOnly && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <IconPlus className="h-4 w-4" />
                Register Visitor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>New Visitor</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Visitor Name</Label>
                    <Input
                      value={form.visitorName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, visitorName: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>NID No</Label>
                    <Input
                      value={form.nidNo}
                      onChange={(e) => setForm((f) => ({ ...f, nidNo: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Company Name</Label>
                    <Input
                      value={form.companyName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, companyName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Address</Label>
                    <Input
                      value={form.address}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, address: e.target.value }))
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <IconUsers className="h-5 w-5 text-primary" />
              Visitors
            </CardTitle>
            <form onSubmit={handlePhoneSearch} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by phone or name..."
                  className="pl-8"
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-muted-foreground/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>NID</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  {!readOnly && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={readOnly ? 5 : 6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={readOnly ? 5 : 6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No visitors found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell className="font-medium">{visitor.visitorName}</TableCell>
                      <TableCell>{visitor.phone ?? "—"}</TableCell>
                      <TableCell>{visitor.nidNo ?? "—"}</TableCell>
                      <TableCell>{visitor.companyName ?? "—"}</TableCell>
                      <TableCell>
                        {visitor.isBlacklisted ? (
                          <Badge variant="destructive">Blacklisted</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      {!readOnly && (
                        <TableCell className="text-right">
                          {!visitor.isBlacklisted && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={blacklistId === visitor.id}
                              onClick={() => handleBlacklist(visitor)}
                            >
                              {blacklistId === visitor.id ? "…" : "Blacklist"}
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
    </div>
  );
}
