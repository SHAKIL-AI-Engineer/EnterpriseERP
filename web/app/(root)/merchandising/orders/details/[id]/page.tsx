"use client";

import * as React from "react";
import { merchandisingService } from "@/lib/services/merchandising";
import type {
  OrderDetails,
  TnaCalendar,
  MaterialBooking,
  OrderDocument,
  BuyerPurchaseOrder,
} from "@/lib/types/merchandising";
import { toast } from "sonner";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  IconPrinter,
  IconDownload,
  IconLoader2,
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconCheck,
  IconCopy,
  IconUserPlus,
  IconFileDescription,
  IconExternalLink,
  IconCalendarEvent,
} from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MerchPageShell,
  MerchPageHeader,
  MerchCompanyGate,
  ColorSizeMatrix,
} from "@/components/merchandising";

function OrderDetailsPageContent({
  companyId,
  orderId,
}: {
  companyId: string;
  orderId: string;
}) {
  const router = useRouter();
  const [details, setDetails] = React.useState<OrderDetails | null>(null);
  const [buyerPos, setBuyerPos] = React.useState<BuyerPurchaseOrder[]>([]);
  const [tna, setTna] = React.useState<TnaCalendar | null>(null);
  const [bookings, setBookings] = React.useState<MaterialBooking[]>([]);
  const [documents, setDocuments] = React.useState<OrderDocument[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [assignmentOpen, setAssignmentOpen] = React.useState(false);
  const [assignmentForm, setAssignmentForm] = React.useState({
    assignedTo: "",
    role: "Merchandiser",
  });

  const [termsOpen, setTermsOpen] = React.useState(false);
  const [termsForm, setTermsForm] = React.useState({
    paymentTerms: "",
    incoterms: "",
    lcBank: "",
    commission: "0",
  });

  const [poForm, setPoForm] = React.useState({
    poNo: "",
    orderQty: "",
    unitPrice: "",
  });
  const [createRequisitionOnConfirm, setCreateRequisitionOnConfirm] = React.useState(false);
  const [editingPoId, setEditingPoId] = React.useState<string | null>(null);
  const [editPoForm, setEditPoForm] = React.useState({
    orderQty: "",
    unitPrice: "",
    status: "Open",
  });

  const [docForm, setDocForm] = React.useState({
    documentType: "Tech Pack",
    fileName: "",
    fileUrl: "",
  });

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [detailsData, pos, tnaData, bookingRows, docs] = await Promise.all([
        merchandisingService.getOrderDetails(orderId),
        merchandisingService.getBuyerPos(orderId),
        merchandisingService.getTnaByOrder(orderId),
        merchandisingService.getMaterialBookings(companyId, orderId),
        merchandisingService.getOrderDocuments(orderId, companyId),
      ]);
      setDetails(detailsData);
      setBuyerPos(pos);
      setTna(tnaData);
      setBookings(bookingRows);
      setDocuments(docs);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  }, [orderId, companyId]);

  React.useEffect(() => {
    if (orderId) fetchData();
  }, [fetchData, orderId]);

  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      await merchandisingService.confirmOrder(orderId, createRequisitionOnConfirm);
      toast.success(
        createRequisitionOnConfirm
          ? "Order confirmed and requisition created"
          : "Order confirmed",
      );
      fetchData();
    } catch {
      toast.error("Failed to confirm order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyBom = async () => {
    try {
      setActionLoading(true);
      const items = await merchandisingService.copyStyleBomToOrder(orderId, companyId);
      toast.success(`Copied ${items.length} BOM items from style`);
      fetchData();
    } catch {
      toast.error("Failed to copy style BOM");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsDeleting(true);
      await merchandisingService.cancelOrder(orderId);
      toast.success("Order cancelled");
      router.push("/merchandising/orders");
    } catch {
      toast.error("Failed to cancel order");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      await merchandisingService.exportOrder(orderId);
      toast.success("Export started");
    } catch {
      toast.error("Export failed");
    }
  };

  const handleCreateAssignment = async () => {
    if (!assignmentForm.assignedTo.trim()) {
      toast.error("Assignee name is required");
      return;
    }
    try {
      await merchandisingService.createOrderAssignment(orderId, {
        companyId,
        assignedTo: assignmentForm.assignedTo.trim(),
        role: assignmentForm.role.trim(),
      });
      toast.success("Assignment created");
      setAssignmentOpen(false);
      setAssignmentForm({ assignedTo: "", role: "Merchandiser" });
    } catch {
      toast.error("Failed to create assignment");
    }
  };

  const handleCreateTerms = async () => {
    try {
      await merchandisingService.createOrderCommercialTerms(orderId, {
        companyId,
        paymentTerms: termsForm.paymentTerms || undefined,
        incoterms: termsForm.incoterms || undefined,
        lcBank: termsForm.lcBank || undefined,
        commission: parseFloat(termsForm.commission) || 0,
      });
      toast.success("Commercial terms saved");
      setTermsOpen(false);
    } catch {
      toast.error("Failed to save commercial terms");
    }
  };

  const handleCreateBuyerPo = async () => {
    if (!poForm.poNo.trim()) {
      toast.error("PO number is required");
      return;
    }
    try {
      const po = await merchandisingService.createBuyerPo(orderId, {
        companyId,
        poNo: poForm.poNo.trim(),
        orderQty: parseInt(poForm.orderQty) || 0,
        unitPrice: parseFloat(poForm.unitPrice) || 0,
      });
      setBuyerPos((prev) => [...prev, po]);
      setPoForm({ poNo: "", orderQty: "", unitPrice: "" });
      toast.success("Buyer PO created");
    } catch {
      toast.error("Failed to create buyer PO");
    }
  };

  const startEditBuyerPo = (po: BuyerPurchaseOrder) => {
    setEditingPoId(po.id);
    setEditPoForm({
      orderQty: String(po.orderQty),
      unitPrice: String(po.unitPrice),
      status: po.status,
    });
  };

  const handleUpdateBuyerPo = async (poId: string) => {
    try {
      const updated = await merchandisingService.updateBuyerPo(poId, {
        orderQty: parseInt(editPoForm.orderQty, 10) || 0,
        unitPrice: parseFloat(editPoForm.unitPrice) || 0,
        status: editPoForm.status,
      });
      setBuyerPos((prev) => prev.map((p) => (p.id === poId ? updated : p)));
      setEditingPoId(null);
      toast.success("Buyer PO updated");
    } catch {
      toast.error("Failed to update buyer PO");
    }
  };

  const handleGenerateTna = async () => {
    try {
      setActionLoading(true);
      const calendar = await merchandisingService.generateTnaForOrder(orderId);
      setTna(calendar);
      toast.success("T&A calendar generated");
    } catch {
      toast.error("Failed to generate T&A");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!docForm.fileName.trim() || !docForm.fileUrl.trim()) {
      toast.error("File name and URL are required");
      return;
    }
    try {
      const doc = await merchandisingService.createOrderDocument(orderId, {
        companyId,
        documentType: docForm.documentType,
        fileName: docForm.fileName.trim(),
        fileUrl: docForm.fileUrl.trim(),
      });
      setDocuments((prev) => [...prev, doc]);
      setDocForm({ documentType: "Tech Pack", fileName: "", fileUrl: "" });
      toast.success("Document added");
    } catch {
      toast.error("Failed to add document");
    }
  };

  if (loading) {
    return (
      <MerchPageShell>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <IconLoader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading order...</p>
        </div>
      </MerchPageShell>
    );
  }

  if (!details) return null;

  const { order, bomItems, costing } = details;
  const matrixRows = details.colorSizeBreakdowns.map((r) => ({
    colorName: r.colorName,
    sizeName: r.sizeName,
    quantity: r.quantity,
  }));

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconFileDescription className="size-6" />}
        title={order.orderNo}
        description={`Order details · ${order.orderStatus}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/merchandising/orders">
              <Button variant="outline" size="sm">
                <IconArrowLeft className="size-4 mr-2" /> Back
              </Button>
            </Link>
            <Link href={`/merchandising/orders/edit/${orderId}`}>
              <Button variant="outline" size="sm">
                <IconEdit className="size-4 mr-2" /> Edit
              </Button>
            </Link>
            {order.orderStatus === "Draft" && (
              <>
                <label className="flex items-center gap-2 text-xs mr-1 cursor-pointer">
                  <Checkbox
                    checked={createRequisitionOnConfirm}
                    onCheckedChange={(v) => setCreateRequisitionOnConfirm(v === true)}
                  />
                  Create requisition on confirm
                </label>
                <Button size="sm" disabled={actionLoading} onClick={handleConfirm}>
                  <IconCheck className="size-4 mr-2" /> Confirm
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" disabled={actionLoading} onClick={handleCopyBom}>
              <IconCopy className="size-4 mr-2" /> Copy Style BOM
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAssignmentOpen(true)}>
              <IconUserPlus className="size-4 mr-2" /> Assign
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTermsOpen(true)}>
              Commercial Terms
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600">
                  <IconTrash className="size-4 mr-2" /> Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <IconAlertCircle className="text-red-600" /> Cancel Order
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cancel order <b>{order.orderNo}</b>? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Order</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>
                    {isDeleting ? "Processing..." : "Confirm Cancel"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <IconPrinter className="size-4 mr-2" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <IconDownload className="size-4 mr-2" /> Export
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="colorsize">Color/Size</TabsTrigger>
          <TabsTrigger value="buyerpos">Buyer POs</TabsTrigger>
          <TabsTrigger value="bom">BOM</TabsTrigger>
          <TabsTrigger value="costing">Costing</TabsTrigger>
          <TabsTrigger value="tna">T&amp;A</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="border-none shadow-sm">
            <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
              <div>
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Order No
                </Label>
                <p className="font-bold">{order.orderNo}</p>
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Status
                </Label>
                <Badge variant="outline">{order.orderStatus}</Badge>
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Order Date
                </Label>
                <p className="font-medium">
                  {order.orderDate
                    ? format(new Date(order.orderDate), "dd MMM yyyy")
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Shipment Date
                </Label>
                <p className="font-medium">
                  {order.shipmentDate
                    ? format(new Date(order.shipmentDate), "dd MMM yyyy")
                    : "—"}
                </p>
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Total Qty
                </Label>
                <p className="font-bold">{order.totalOrderQty.toLocaleString()} PCS</p>
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Unit Price
                </Label>
                <p className="font-medium">
                  {order.currencyCode} {order.unitPrice.toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Total Value
                </Label>
                <p className="font-bold">
                  {order.currencyCode} {order.totalValue.toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Shipment Plans
                </Label>
                <p className="font-medium">{details.shipmentPlans.length}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colorsize">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Color / Size Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <ColorSizeMatrix rows={matrixRows} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buyerpos">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Buyer Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  placeholder="PO No"
                  value={poForm.poNo}
                  onChange={(e) => setPoForm((p) => ({ ...p, poNo: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Order Qty"
                  value={poForm.orderQty}
                  onChange={(e) => setPoForm((p) => ({ ...p, orderQty: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Unit Price"
                  value={poForm.unitPrice}
                  onChange={(e) => setPoForm((p) => ({ ...p, unitPrice: e.target.value }))}
                />
                <Button onClick={handleCreateBuyerPo}>Add PO</Button>
              </div>
              {buyerPos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No buyer POs yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-3 py-2 text-left">PO No</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Unit Price</th>
                        <th className="px-3 py-2 text-right">Value</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buyerPos.map((po) => (
                        <tr key={po.id} className="border-b">
                          <td className="px-3 py-2 font-medium">{po.poNo}</td>
                          <td className="px-3 py-2 text-right">
                            {editingPoId === po.id ? (
                              <Input
                                type="number"
                                className="h-8 w-24 ml-auto"
                                value={editPoForm.orderQty}
                                onChange={(e) => setEditPoForm((p) => ({ ...p, orderQty: e.target.value }))}
                              />
                            ) : (
                              po.orderQty.toLocaleString()
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {editingPoId === po.id ? (
                              <Input
                                type="number"
                                className="h-8 w-24 ml-auto"
                                value={editPoForm.unitPrice}
                                onChange={(e) => setEditPoForm((p) => ({ ...p, unitPrice: e.target.value }))}
                              />
                            ) : (
                              po.unitPrice.toLocaleString()
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">{po.totalValue.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            {editingPoId === po.id ? (
                              <NativeSelect
                                className="h-8 text-xs"
                                value={editPoForm.status}
                                onChange={(e) => setEditPoForm((p) => ({ ...p, status: e.target.value }))}
                              >
                                <option value="Open">Open</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Closed">Closed</option>
                              </NativeSelect>
                            ) : (
                              <Badge variant="outline">{po.status}</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {editingPoId === po.id ? (
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="outline" onClick={() => setEditingPoId(null)}>
                                  Cancel
                                </Button>
                                <Button size="sm" onClick={() => handleUpdateBuyerPo(po.id)}>
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => startEditBuyerPo(po)}>
                                Edit
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bom">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Bill of Materials</CardTitle>
              <Link href={`/merchandising/bom?orderId=${orderId}`}>
                <Button variant="outline" size="sm">
                  <IconExternalLink className="size-4 mr-2" /> Open BOM Manager
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bomItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No BOM items. Use &quot;Copy Style BOM&quot; to import from the linked style.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">Item</th>
                        <th className="px-3 py-2 text-right">Consumption</th>
                        <th className="px-3 py-2 text-right">Required Qty</th>
                        <th className="px-3 py-2 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bomItems.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-3 py-2">{item.itemType}</td>
                          <td className="px-3 py-2 font-medium">{item.itemName}</td>
                          <td className="px-3 py-2 text-right">{item.consumption}</td>
                          <td className="px-3 py-2 text-right">{item.requiredQty.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{item.totalCost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costing">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Order Costing</CardTitle>
            </CardHeader>
            <CardContent>
              {!costing ? (
                <p className="text-sm text-muted-foreground">No costing record for this order.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Fabric</Label>
                    <p className="font-medium">{costing.fabricCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Accessories</Label>
                    <p className="font-medium">{costing.accessoriesCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">CM</Label>
                    <p className="font-medium">{costing.cm.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Total Cost</Label>
                    <p className="font-bold">{costing.totalCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Selling Price</Label>
                    <p className="font-medium">{costing.sellingPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Profit</Label>
                    <p className="font-medium">
                      {costing.profitAmount.toLocaleString()} ({costing.profitPercent}%)
                    </p>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Final FOB</Label>
                    <p className="font-bold">{costing.finalFob.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Approval</Label>
                    <Badge variant="outline">{costing.approvalStatus}</Badge>
                  </div>
                </div>
              )}
              <Link href="/merchandising/costing" className="inline-block mt-4">
                <Button variant="outline" size="sm">
                  <IconExternalLink className="size-4 mr-2" /> Open Costing Module
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tna">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <IconCalendarEvent className="size-4" /> Time &amp; Action
              </CardTitle>
              {!tna && (
                <Button size="sm" disabled={actionLoading} onClick={handleGenerateTna}>
                  Generate T&amp;A
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!tna ? (
                <p className="text-sm text-muted-foreground">
                  No T&amp;A calendar. Generate one from the order template.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-4 text-sm">
                    <span>
                      Start: {format(new Date(tna.startDate), "dd MMM yyyy")}
                    </span>
                    <Badge variant="outline">{tna.status}</Badge>
                  </div>
                  {(tna.milestones ?? []).length > 0 && (
                    <div className="overflow-x-auto rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40">
                            <th className="px-3 py-2 text-left">#</th>
                            <th className="px-3 py-2 text-left">Milestone</th>
                            <th className="px-3 py-2 text-left">Planned</th>
                            <th className="px-3 py-2 text-left">Actual</th>
                            <th className="px-3 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(tna.milestones ?? []).map((m) => (
                            <tr key={m.id} className="border-b">
                              <td className="px-3 py-2">{m.sequenceNo}</td>
                              <td className="px-3 py-2 font-medium">{m.milestoneName}</td>
                              <td className="px-3 py-2">
                                {format(new Date(m.plannedDate), "dd MMM yyyy")}
                              </td>
                              <td className="px-3 py-2">
                                {m.actualDate
                                  ? format(new Date(m.actualDate), "dd MMM yyyy")
                                  : "—"}
                              </td>
                              <td className="px-3 py-2">
                                <Badge variant="outline">{m.status}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              <Link href="/merchandising/ta-calendar" className="inline-block mt-4">
                <Button variant="outline" size="sm">
                  <IconExternalLink className="size-4 mr-2" /> T&amp;A Calendar
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Material Bookings</CardTitle>
              <Link href={`/merchandising/bookings?orderId=${orderId}`}>
                <Button variant="outline" size="sm">
                  <IconExternalLink className="size-4 mr-2" /> Open Bookings
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings for this order.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-3 py-2 text-left">Booking No</th>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-right">Total Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b">
                          <td className="px-3 py-2 font-medium">{b.bookingNo}</td>
                          <td className="px-3 py-2">{b.bookingType}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline">{b.status}</Badge>
                          </td>
                          <td className="px-3 py-2 text-right">{b.totalQty.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Order Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  placeholder="Document type"
                  value={docForm.documentType}
                  onChange={(e) =>
                    setDocForm((p) => ({ ...p, documentType: e.target.value }))
                  }
                />
                <Input
                  placeholder="File name"
                  value={docForm.fileName}
                  onChange={(e) => setDocForm((p) => ({ ...p, fileName: e.target.value }))}
                />
                <Input
                  placeholder="File URL"
                  value={docForm.fileUrl}
                  onChange={(e) => setDocForm((p) => ({ ...p, fileUrl: e.target.value }))}
                />
                <Button onClick={handleCreateDocument}>Add Document</Button>
              </div>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents attached.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">File</th>
                        <th className="px-3 py-2 text-left">Version</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id} className="border-b">
                          <td className="px-3 py-2">{doc.documentType}</td>
                          <td className="px-3 py-2">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {doc.fileName}
                            </a>
                          </td>
                          <td className="px-3 py-2">{doc.version ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Order Assignment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Assigned To</Label>
              <Input
                value={assignmentForm.assignedTo}
                onChange={(e) =>
                  setAssignmentForm((p) => ({ ...p, assignedTo: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Input
                value={assignmentForm.role}
                onChange={(e) => setAssignmentForm((p) => ({ ...p, role: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssignment}>Save Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commercial Terms</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Terms</Label>
              <Input
                value={termsForm.paymentTerms}
                onChange={(e) =>
                  setTermsForm((p) => ({ ...p, paymentTerms: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Incoterms</Label>
              <Input
                value={termsForm.incoterms}
                onChange={(e) =>
                  setTermsForm((p) => ({ ...p, incoterms: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">LC Bank</Label>
              <Input
                value={termsForm.lcBank}
                onChange={(e) =>
                  setTermsForm((p) => ({ ...p, lcBank: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Commission %</Label>
              <Input
                type="number"
                value={termsForm.commission}
                onChange={(e) =>
                  setTermsForm((p) => ({ ...p, commission: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTermsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTerms}>Save Terms</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  );
}

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;

  return (
    <MerchCompanyGate>
      {(companyId) => (
        <OrderDetailsPageContent companyId={companyId} orderId={orderId} />
      )}
    </MerchCompanyGate>
  );
}
