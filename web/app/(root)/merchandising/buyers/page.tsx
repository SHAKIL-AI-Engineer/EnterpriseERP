"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconUsers,
  IconPlus,
  IconRefresh,
  IconEye,
  IconPencil,
  IconPlayerPlay,
  IconPlayerPause,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchTableCard,
} from "@/components/merchandising"
import { merchandisingService } from "@/lib/services/merchandising"
import type {
  Buyer,
  BuyerComplianceRule,
  BuyerContact,
  BuyerPaymentTerm,
  CreateBuyerRequest,
  UpdateBuyerRequest,
} from "@/lib/types/merchandising"
import { cn } from "@/lib/utils"

const emptyCreateForm = (): Partial<CreateBuyerRequest> => ({
  buyerCode: "",
  buyerName: "",
  country: "",
  contactPerson: "",
  email: "",
  currency: "USD",
  leadTimeDays: 0,
})

export default function BuyersPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <BuyersPageContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function BuyersPageContent({ companyId }: { companyId: string }) {
  const [buyers, setBuyers] = React.useState<Buyer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingBuyer, setEditingBuyer] = React.useState<Buyer | null>(null)
  const [newBuyer, setNewBuyer] = React.useState<Partial<CreateBuyerRequest>>(emptyCreateForm())
  const [detailBuyer, setDetailBuyer] = React.useState<Buyer | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [contacts, setContacts] = React.useState<BuyerContact[]>([])
  const [paymentTerms, setPaymentTerms] = React.useState<BuyerPaymentTerm[]>([])
  const [complianceRules, setComplianceRules] = React.useState<BuyerComplianceRule[]>([])
  const [detailLoading, setDetailLoading] = React.useState(false)
  const [contactForm, setContactForm] = React.useState({ name: "", email: "", phone: "", role: "" })
  const [paymentForm, setPaymentForm] = React.useState({ termName: "", days: 30, description: "" })
  const [complianceForm, setComplianceForm] = React.useState({
    ruleName: "",
    ruleType: "Audit",
    description: "",
    isMandatory: true,
  })

  const fetchBuyers = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await merchandisingService.getBuyers(companyId)
      setBuyers(data)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load buyers")
    } finally {
      setLoading(false)
    }
  }, [companyId])

  React.useEffect(() => {
    fetchBuyers()
  }, [fetchBuyers])

  const openDetail = async (buyer: Buyer) => {
    setDetailOpen(true)
    setPaymentTerms([])
    setComplianceRules([])
    setContactForm({ name: "", email: "", phone: "", role: "" })
    try {
      setDetailLoading(true)
      const [detail, rows, terms, rules] = await Promise.all([
        merchandisingService.getBuyerById(buyer.id, companyId),
        merchandisingService.getBuyerContacts(buyer.id),
        merchandisingService.getBuyerPaymentTerms(buyer.id),
        merchandisingService.getBuyerComplianceRules(buyer.id),
      ])
      setDetailBuyer(detail)
      setContacts(rows)
      setPaymentTerms(terms)
      setComplianceRules(rules)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load buyer contacts")
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newBuyer.buyerCode?.trim() || !newBuyer.buyerName?.trim()) {
      toast.error("Buyer code and name are required")
      return
    }
    try {
      const payload: CreateBuyerRequest = {
        companyId,
        buyerCode: newBuyer.buyerCode.trim(),
        buyerName: newBuyer.buyerName.trim(),
        country: newBuyer.country,
        contactPerson: newBuyer.contactPerson,
        email: newBuyer.email,
        phone: newBuyer.phone,
        address: newBuyer.address,
        paymentTerms: newBuyer.paymentTerms,
        currency: newBuyer.currency,
        leadTimeDays: newBuyer.leadTimeDays,
      }
      await merchandisingService.createBuyer(payload)
      toast.success("Buyer created")
      setIsCreateOpen(false)
      setNewBuyer(emptyCreateForm())
      fetchBuyers()
    } catch (error) {
      console.error(error)
      toast.error("Failed to create buyer")
    }
  }

  const handleUpdate = async () => {
    if (!editingBuyer) return
    try {
      const payload: UpdateBuyerRequest = {
        buyerName: editingBuyer.buyerName,
        country: editingBuyer.country ?? undefined,
        contactPerson: editingBuyer.contactPerson ?? undefined,
        email: editingBuyer.email ?? undefined,
        phone: editingBuyer.phone ?? undefined,
        address: editingBuyer.address ?? undefined,
        isActive: editingBuyer.isActive,
        paymentTerms: editingBuyer.paymentTerms ?? undefined,
        currency: editingBuyer.currency ?? undefined,
        leadTimeDays: editingBuyer.leadTimeDays ?? undefined,
      }
      await merchandisingService.updateBuyer(editingBuyer.id, payload)
      toast.success("Buyer updated")
      setIsEditOpen(false)
      fetchBuyers()
    } catch (error) {
      console.error(error)
      toast.error("Failed to update buyer")
    }
  }

  const handleActivate = async (buyer: Buyer) => {
    try {
      await merchandisingService.activateBuyer(buyer.id)
      toast.success("Buyer activated")
      fetchBuyers()
      if (detailBuyer?.id === buyer.id) {
        setDetailBuyer({ ...buyer, isActive: true })
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to activate buyer")
    }
  }

  const handleDeactivate = async (buyer: Buyer) => {
    try {
      await merchandisingService.deactivateBuyer(buyer.id)
      toast.success("Buyer deactivated")
      fetchBuyers()
      if (detailBuyer?.id === buyer.id) {
        setDetailBuyer({ ...buyer, isActive: false })
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to deactivate buyer")
    }
  }

  const handleAddContact = async () => {
    if (!detailBuyer || !contactForm.name.trim()) {
      toast.error("Contact name is required")
      return
    }
    try {
      const created = await merchandisingService.createBuyerContact({
        companyId,
        buyerId: detailBuyer.id,
        name: contactForm.name.trim(),
        email: contactForm.email || undefined,
        phone: contactForm.phone || undefined,
        role: contactForm.role || undefined,
      })
      setContacts((prev) => [...prev, created])
      setContactForm({ name: "", email: "", phone: "", role: "" })
      toast.success("Contact added")
    } catch (error) {
      console.error(error)
      toast.error("Failed to add contact")
    }
  }

  const handleAddPaymentTerm = async () => {
    if (!detailBuyer || !paymentForm.termName.trim()) {
      toast.error("Term name is required")
      return
    }
    try {
      const created = await merchandisingService.createBuyerPaymentTerm({
        companyId,
        buyerId: detailBuyer.id,
        termName: paymentForm.termName.trim(),
        days: paymentForm.days,
        description: paymentForm.description || undefined,
      })
      setPaymentTerms((prev) => [...prev, created])
      setPaymentForm({ termName: "", days: 30, description: "" })
      toast.success("Payment term added")
    } catch (error) {
      console.error(error)
      toast.error("Failed to add payment term")
    }
  }

  const handleAddCompliance = async () => {
    if (!detailBuyer || !complianceForm.ruleName.trim()) {
      toast.error("Rule name is required")
      return
    }
    try {
      const created = await merchandisingService.createBuyerComplianceRule({
        companyId,
        buyerId: detailBuyer.id,
        ruleName: complianceForm.ruleName.trim(),
        ruleType: complianceForm.ruleType,
        description: complianceForm.description || undefined,
        isMandatory: complianceForm.isMandatory,
      })
      setComplianceRules((prev) => [...prev, created])
      setComplianceForm({ ruleName: "", ruleType: "Audit", description: "", isMandatory: true })
      toast.success("Compliance rule added")
    } catch (error) {
      console.error(error)
      toast.error("Failed to add compliance rule")
    }
  }

  const columns = React.useMemo<ColumnDef<Buyer>[]>(
    () => [
      {
        accessorKey: "buyerCode",
        header: "Code",
        cell: ({ row }) => (
          <span className="text-xs font-mono font-bold text-muted-foreground">{row.original.buyerCode}</span>
        ),
        size: 90,
      },
      {
        accessorKey: "buyerName",
        header: "Buyer",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{row.original.buyerName}</span>
            <span className="text-[10px] text-muted-foreground">{row.original.country || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "contactPerson",
        header: "Contact",
        cell: ({ row }) => <span className="text-xs">{row.original.contactPerson || "—"}</span>,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <span className="text-xs truncate max-w-[180px] block">{row.original.email || "—"}</span>,
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ row }) => <span className="text-xs font-mono">{row.original.currency || "—"}</span>,
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? "default" : "secondary"}
            className={cn("text-[10px] uppercase", row.original.isActive && "bg-emerald-600")}
          >
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(row.original)}>
              <IconEye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditingBuyer({ ...row.original })
                setIsEditOpen(true)
              }}
            >
              <IconPencil className="size-4" />
            </Button>
            {row.original.isActive ? (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeactivate(row.original)}>
                <IconPlayerPause className="size-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleActivate(row.original)}>
                <IconPlayerPlay className="size-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyId],
  )

  const buyerFormFields = (
    values: Partial<CreateBuyerRequest> & { isActive?: boolean },
    onChange: (next: Partial<CreateBuyerRequest> & { isActive?: boolean }) => void,
    opts?: { lockCode?: boolean },
  ) => (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Buyer Code</Label>
          <Input
            value={values.buyerCode || ""}
            readOnly={opts?.lockCode}
            onChange={(e) => onChange({ ...values, buyerCode: e.target.value.toUpperCase() })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Buyer Name</Label>
          <Input value={values.buyerName || ""} onChange={(e) => onChange({ ...values, buyerName: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Country</Label>
          <Input value={values.country || ""} onChange={(e) => onChange({ ...values, country: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Contact Person</Label>
          <Input
            value={values.contactPerson || ""}
            onChange={(e) => onChange({ ...values, contactPerson: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Email</Label>
          <Input type="email" value={values.email || ""} onChange={(e) => onChange({ ...values, email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Currency</Label>
          <Input value={values.currency || ""} onChange={(e) => onChange({ ...values, currency: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Lead Time (days)</Label>
        <Input
          type="number"
          value={values.leadTimeDays ?? 0}
          onChange={(e) => onChange({ ...values, leadTimeDays: parseInt(e.target.value, 10) || 0 })}
        />
      </div>
      {typeof values.isActive === "boolean" ? (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label className="text-xs">Active</Label>
          <Switch checked={values.isActive} onCheckedChange={(v) => onChange({ ...values, isActive: v })} />
        </div>
      ) : null}
    </div>
  )

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconUsers className="size-6" />}
        title="Buyer Directory"
        description="Manage global buyer partners, contacts, and compliance"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchBuyers} disabled={loading}>
              <IconRefresh className={cn("size-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <IconPlus className="size-4 mr-2" />
              Add Buyer
            </Button>
          </>
        }
      />

      <MerchTableCard isLoading={loading} loadingMessage="Loading buyers...">
        <DataTable columns={columns} data={buyers} searchKey="buyerName" showTabs={false} showActions={false} />
      </MerchTableCard>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Buyer</DialogTitle>
            <DialogDescription>Register a buyer for this company</DialogDescription>
          </DialogHeader>
          {buyerFormFields(newBuyer, setNewBuyer)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Buyer</DialogTitle>
          </DialogHeader>
          {editingBuyer &&
            buyerFormFields(
              {
                buyerCode: editingBuyer.buyerCode,
                buyerName: editingBuyer.buyerName,
                country: editingBuyer.country ?? undefined,
                contactPerson: editingBuyer.contactPerson ?? undefined,
                email: editingBuyer.email ?? undefined,
                currency: editingBuyer.currency ?? undefined,
                leadTimeDays: editingBuyer.leadTimeDays ?? undefined,
                isActive: editingBuyer.isActive,
              },
              (next) =>
                setEditingBuyer({
                  ...editingBuyer,
                  buyerName: next.buyerName ?? editingBuyer.buyerName,
                  country: next.country ?? null,
                  contactPerson: next.contactPerson ?? null,
                  email: next.email ?? null,
                  currency: next.currency ?? null,
                  leadTimeDays: next.leadTimeDays ?? null,
                  isActive: next.isActive ?? editingBuyer.isActive,
                }),
              { lockCode: true },
            )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{detailBuyer?.buyerName}</SheetTitle>
            <SheetDescription>
              {detailBuyer?.buyerCode} · {detailBuyer?.country || "No country"}
            </SheetDescription>
          </SheetHeader>
          {detailBuyer ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={detailBuyer.isActive ? "default" : "secondary"}>
                  {detailBuyer.isActive ? "Active" : "Inactive"}
                </Badge>
                {detailBuyer.isActive ? (
                  <Button size="sm" variant="outline" onClick={() => handleDeactivate(detailBuyer)}>
                    Deactivate
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handleActivate(detailBuyer)}>
                    Activate
                  </Button>
                )}
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/merchandising/brands?buyerId=${detailBuyer.id}`}>View brands</Link>
                </Button>
              </div>

              <Tabs defaultValue="contacts">
                <TabsList className="w-full">
                  <TabsTrigger value="contacts" className="flex-1">Contacts</TabsTrigger>
                  <TabsTrigger value="payment" className="flex-1">Payment</TabsTrigger>
                  <TabsTrigger value="compliance" className="flex-1">Compliance</TabsTrigger>
                </TabsList>

                <TabsContent value="contacts" className="space-y-4 mt-4">
                  {detailLoading ? (
                    <p className="text-sm text-muted-foreground">Loading contacts...</p>
                  ) : contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No contacts yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {contacts.map((c) => (
                        <li key={c.id} className="rounded-lg border p-3 text-sm">
                          <p className="font-semibold">{c.name}</p>
                          <p className="text-muted-foreground text-xs">{c.role || "—"} · {c.email || "—"}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="grid gap-3 border-t pt-4">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Add contact</Label>
                    <Input placeholder="Name" value={contactForm.name} onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))} />
                    <Input placeholder="Email" value={contactForm.email} onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))} />
                    <Input placeholder="Phone" value={contactForm.phone} onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))} />
                    <Input placeholder="Role" value={contactForm.role} onChange={(e) => setContactForm((p) => ({ ...p, role: e.target.value }))} />
                    <Button size="sm" onClick={handleAddContact}>Add Contact</Button>
                  </div>
                </TabsContent>

                <TabsContent value="payment" className="space-y-4 mt-4">
                  {paymentTerms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payment terms added this session.</p>
                  ) : (
                    <ul className="space-y-2">
                      {paymentTerms.map((t) => (
                        <li key={t.id} className="rounded-lg border p-3 text-sm">
                          <p className="font-semibold">{t.termName}</p>
                          <p className="text-xs text-muted-foreground">{t.days} days · {t.description || "—"}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="grid gap-3 border-t pt-4">
                    <Input placeholder="Term name" value={paymentForm.termName} onChange={(e) => setPaymentForm((p) => ({ ...p, termName: e.target.value }))} />
                    <Input type="number" placeholder="Days" value={paymentForm.days} onChange={(e) => setPaymentForm((p) => ({ ...p, days: parseInt(e.target.value, 10) || 0 }))} />
                    <Textarea placeholder="Description" value={paymentForm.description} onChange={(e) => setPaymentForm((p) => ({ ...p, description: e.target.value }))} />
                    <Button size="sm" onClick={handleAddPaymentTerm}>Add Payment Term</Button>
                  </div>
                </TabsContent>

                <TabsContent value="compliance" className="space-y-4 mt-4">
                  {complianceRules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No compliance rules added this session.</p>
                  ) : (
                    <ul className="space-y-2">
                      {complianceRules.map((r) => (
                        <li key={r.id} className="rounded-lg border p-3 text-sm">
                          <p className="font-semibold">{r.ruleName}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.ruleType} · {r.isMandatory ? "Mandatory" : "Optional"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="grid gap-3 border-t pt-4">
                    <Input placeholder="Rule name" value={complianceForm.ruleName} onChange={(e) => setComplianceForm((p) => ({ ...p, ruleName: e.target.value }))} />
                    <NativeSelect value={complianceForm.ruleType} onChange={(e) => setComplianceForm((p) => ({ ...p, ruleType: e.target.value }))}>
                      <option value="Audit">Audit</option>
                      <option value="Certification">Certification</option>
                      <option value="Social">Social</option>
                    </NativeSelect>
                    <Textarea placeholder="Description" value={complianceForm.description} onChange={(e) => setComplianceForm((p) => ({ ...p, description: e.target.value }))} />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={complianceForm.isMandatory}
                        onChange={(e) => setComplianceForm((p) => ({ ...p, isMandatory: e.target.checked }))}
                      />
                      Mandatory
                    </label>
                    <Button size="sm" onClick={handleAddCompliance}>Add Rule</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </MerchPageShell>
  )
}
