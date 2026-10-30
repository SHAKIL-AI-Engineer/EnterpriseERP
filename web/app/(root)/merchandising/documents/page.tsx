"use client";

import * as React from "react";
import {
  IconFileText,
  IconRefresh,
  IconPlus,
  IconMessages,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchTableCard,
  MerchEmptyState,
} from "@/components/merchandising";
import { merchandisingService } from "@/lib/services/merchandising";
import type {
  Order,
  OrderDocument,
  Style,
  StyleDocument,
  CommunicationLog,
} from "@/lib/types/merchandising";
import { format } from "date-fns";

type DocRow =
  | (StyleDocument & { scope: "style"; ref: string })
  | (OrderDocument & { scope: "order"; ref: string });

export default function MerchandisingDocumentsPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <MerchandisingDocumentsPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}

function MerchandisingDocumentsPageContent({ companyId }: { companyId: string }) {
  const [mainTab, setMainTab] = React.useState<"documents" | "communications">("documents");
  const [docTab, setDocTab] = React.useState<"style" | "order">("style");
  const [styles, setStyles] = React.useState<Style[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [selectedStyleId, setSelectedStyleId] = React.useState("");
  const [selectedOrderId, setSelectedOrderId] = React.useState("");
  const [documents, setDocuments] = React.useState<DocRow[]>([]);
  const [communications, setCommunications] = React.useState<CommunicationLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [commOpen, setCommOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    documentType: "TechPack",
    fileName: "",
    fileUrl: "",
    version: "1.0",
  });
  const [commForm, setCommForm] = React.useState({
    subject: "",
    direction: "Outbound",
    message: "",
    styleId: "",
    orderId: "",
  });

  const fetchMasters = React.useCallback(async () => {
    try {
      const [styleRows, orderRows] = await Promise.all([
        merchandisingService.getStyles(companyId),
        merchandisingService.getOrders(companyId),
      ]);
      setStyles(styleRows);
      setOrders(orderRows);
      if (styleRows.length && !selectedStyleId) setSelectedStyleId(styleRows[0].id);
      if (orderRows.length && !selectedOrderId) setSelectedOrderId(orderRows[0].id);
    } catch (error) {
      console.error(error);
    }
  }, [companyId, selectedStyleId, selectedOrderId]);

  const fetchDocuments = React.useCallback(async () => {
    try {
      setLoading(true);
      const rows: DocRow[] = [];
      if (docTab === "style") {
        const styleId = selectedStyleId || styles[0]?.id;
        if (styleId) {
          const docs = await merchandisingService.getStyleDocuments(styleId, companyId);
          const style = styles.find((s) => s.id === styleId);
          docs.forEach((d) =>
            rows.push({ ...d, scope: "style", ref: style?.styleNo ?? styleId }),
          );
        }
      } else {
        const orderId = selectedOrderId || orders[0]?.id;
        if (orderId) {
          const docs = await merchandisingService.getOrderDocuments(orderId, companyId);
          const order = orders.find((o) => o.id === orderId);
          docs.forEach((d) =>
            rows.push({ ...d, scope: "order", ref: order?.orderNo ?? orderId }),
          );
        }
      }
      setDocuments(rows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [companyId, docTab, selectedStyleId, selectedOrderId, styles, orders]);

  const fetchCommunications = React.useCallback(async () => {
    try {
      setLoading(true);
      const logs = await merchandisingService.getCommunications(
        companyId,
        commForm.styleId || selectedStyleId || undefined,
        commForm.orderId || selectedOrderId || undefined,
      );
      setCommunications(logs);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load communications");
    } finally {
      setLoading(false);
    }
  }, [companyId, commForm.styleId, commForm.orderId, selectedStyleId, selectedOrderId]);

  React.useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  React.useEffect(() => {
    if (mainTab === "documents" && (styles.length || orders.length)) {
      fetchDocuments();
    }
  }, [mainTab, fetchDocuments, styles.length, orders.length]);

  React.useEffect(() => {
    if (mainTab === "communications") {
      fetchCommunications();
    }
  }, [mainTab, fetchCommunications]);

  const handleCreateDoc = async () => {
    if (!form.fileName.trim() || !form.fileUrl.trim()) {
      toast.error("File name and URL are required");
      return;
    }
    try {
      const payload = {
        companyId,
        documentType: form.documentType,
        fileName: form.fileName.trim(),
        fileUrl: form.fileUrl.trim(),
        version: form.version || undefined,
      };
      if (docTab === "style" && selectedStyleId) {
        await merchandisingService.createStyleDocument(selectedStyleId, payload);
      } else if (docTab === "order" && selectedOrderId) {
        await merchandisingService.createOrderDocument(selectedOrderId, payload);
      } else {
        toast.error("Select a style or order first");
        return;
      }
      toast.success("Document registered");
      setIsCreateOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save document");
    }
  };

  const handleCreateComm = async () => {
    if (!commForm.subject.trim() || !commForm.message.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    try {
      await merchandisingService.createCommunication({
        companyId,
        styleId: commForm.styleId || selectedStyleId || undefined,
        orderId: commForm.orderId || selectedOrderId || undefined,
        subject: commForm.subject.trim(),
        direction: commForm.direction,
        message: commForm.message.trim(),
      });
      toast.success("Communication logged");
      setCommOpen(false);
      fetchCommunications();
    } catch (error) {
      console.error(error);
      toast.error("Failed to log communication");
    }
  };

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconFileText className="size-6" />}
        title="Document archive"
        description="Style and order documents plus buyer communications"
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                mainTab === "documents" ? fetchDocuments() : fetchCommunications()
              }
            >
              <IconRefresh className="size-4" />
            </Button>
            {mainTab === "documents" ? (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <IconPlus className="size-4 mr-1" />
                    Register document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Register document</DialogTitle>
                    <DialogDescription>
                      Attach a file reference to the selected {docTab}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Document type</Label>
                      <Input
                        value={form.documentType}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, documentType: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>File name</Label>
                      <Input
                        value={form.fileName}
                        onChange={(e) => setForm((p) => ({ ...p, fileName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>File URL</Label>
                      <Input
                        value={form.fileUrl}
                        onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Version</Label>
                      <Input
                        value={form.version}
                        onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateDoc}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={commOpen} onOpenChange={setCommOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <IconPlus className="size-4 mr-1" />
                    Log communication
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log communication</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        value={commForm.subject}
                        onChange={(e) =>
                          setCommForm((p) => ({ ...p, subject: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Direction</Label>
                      <NativeSelect
                        value={commForm.direction}
                        onChange={(e) =>
                          setCommForm((p) => ({ ...p, direction: e.target.value }))
                        }
                      >
                        <option value="Outbound">Outbound</option>
                        <option value="Inbound">Inbound</option>
                      </NativeSelect>
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={commForm.message}
                        onChange={(e) =>
                          setCommForm((p) => ({ ...p, message: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCommOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateComm}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        }
      />

      <Tabs
        value={mainTab}
        onValueChange={(v) => setMainTab(v as "documents" | "communications")}
      >
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="communications">
            <IconMessages className="size-4 mr-1" />
            Communications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4 space-y-4">
          <Tabs value={docTab} onValueChange={(v) => setDocTab(v as "style" | "order")}>
            <TabsList>
              <TabsTrigger value="style">Style documents</TabsTrigger>
              <TabsTrigger value="order">Order documents</TabsTrigger>
            </TabsList>
            <TabsContent value="style" className="mt-3">
              <NativeSelect
                className="h-9 w-64"
                value={selectedStyleId}
                onChange={(e) => setSelectedStyleId(e.target.value)}
              >
                {styles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.styleNo}
                  </option>
                ))}
              </NativeSelect>
            </TabsContent>
            <TabsContent value="order" className="mt-3">
              <NativeSelect
                className="h-9 w-64"
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNo}
                  </option>
                ))}
              </NativeSelect>
            </TabsContent>
          </Tabs>

          <MerchTableCard isLoading={loading}>
            {documents.length === 0 && !loading ? (
              <MerchEmptyState title="No documents" description="Register a document for this reference." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Version</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{doc.ref}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {doc.scope}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline text-sm"
                        >
                          {doc.fileName}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {doc.documentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {doc.version ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </MerchTableCard>
        </TabsContent>

        <TabsContent value="communications" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-4">
            <NativeSelect
              className="h-9 w-48"
              value={commForm.styleId || selectedStyleId}
              onChange={(e) => setCommForm((p) => ({ ...p, styleId: e.target.value }))}
            >
              <option value="">All styles</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.styleNo}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              className="h-9 w-48"
              value={commForm.orderId || selectedOrderId}
              onChange={(e) => setCommForm((p) => ({ ...p, orderId: e.target.value }))}
            >
              <option value="">All orders</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNo}
                </option>
              ))}
            </NativeSelect>
          </div>

          <MerchTableCard isLoading={loading}>
            {communications.length === 0 && !loading ? (
              <MerchEmptyState
                title="No communications"
                description="Log buyer or internal messages linked to styles or orders."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communications.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.loggedAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{log.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.direction}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                        {log.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </MerchTableCard>
        </TabsContent>
      </Tabs>
    </MerchPageShell>
  );
}
