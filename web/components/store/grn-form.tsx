"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { IconTrash, IconPlus, IconCalendar, IconLoader2 } from "@tabler/icons-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { storeService } from "@/lib/services/store"
import type { StoreItem } from "@/lib/types/store"
import { toast } from "sonner"

const itemSchema = z.object({
    itemId: z.string().min(1, "Item is required"),
    unit: z.string(),
    quantity: z.number().min(1, "Qty > 0"),
    rate: z.number().min(0, "Rate >= 0"),
    amount: z.number(),
})

const formSchema = z.object({
    supplier: z.string().min(1, "Supplier is required"),
    poReference: z.string().optional(),
    date: z.date({ message: "Date is required" }),
    items: z.array(itemSchema).min(1, "At least one item is required"),
    totalAmount: z.number(),
    notes: z.string().optional(),
})

interface GrnFormProps {
    companyId: string
    onSubmit: () => void
    onCancel: () => void
}

export function GrnForm({ companyId, onSubmit, onCancel }: GrnFormProps) {
    const [itemsList, setItemsList] = React.useState<StoreItem[]>([])
    const [loadingItems, setLoadingItems] = React.useState(true)
    const [submitting, setSubmitting] = React.useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            supplier: "",
            poReference: "",
            date: new Date(),
            items: [{ itemId: "", unit: "", quantity: 0, rate: 0, amount: 0 }],
            totalAmount: 0,
            notes: "",
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    })

    const watchItems = form.watch("items")

    React.useEffect(() => {
        const fetchItems = async () => {
            try {
                const data = await storeService.getItems(companyId)
                setItemsList(data)
            } catch {
                toast.error("Failed to load items")
            } finally {
                setLoadingItems(false)
            }
        }
        fetchItems()
    }, [companyId])

    const calculateTotal = () => {
        return (watchItems || []).reduce((sum, item) => sum + ((item.quantity || 0) * (item.rate || 0)), 0)
    }

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        setSubmitting(true)
        try {
            await storeService.addGrn({
                companyId,
                grnNo: `GRN-${Date.now().toString().slice(-8)}`,
                grnDate: values.date.toISOString().split("T")[0],
                supplier: values.supplier,
                poReference: values.poReference,
                lines: values.items.map(row => {
                    const item = itemsList.find(i => i.id === row.itemId)
                    return {
                        itemId: row.itemId,
                        itemName: item?.itemName ?? "Unknown",
                        quantity: row.quantity,
                        rate: row.rate,
                    }
                }),
            })
            onSubmit()
        } catch {
            toast.error("Failed to create GRN")
        } finally {
            setSubmitting(false)
        }
    }

    if (loadingItems) {
        return (
            <div className="flex h-40 items-center justify-center">
                <IconLoader2 className="animate-spin size-6 text-primary" />
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                        control={form.control}
                        name="supplier"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Supplier Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Select Supplier..." {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="poReference"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>PO / Invoice Ref</FormLabel>
                                <FormControl>
                                    <Input placeholder="PO-2026-..." {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Receive Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30%]">Item</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Rate (৳)</TableHead>
                                <TableHead>Amount (৳)</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.itemId`}
                                            render={({ field: itemField }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Select
                                                            value={itemField.value}
                                                            onValueChange={(val) => {
                                                                itemField.onChange(val)
                                                                const selectedItem = itemsList.find(i => i.id === val)
                                                                if (selectedItem) {
                                                                    form.setValue(`items.${index}.unit`, selectedItem.unitName ?? "")
                                                                    form.setValue(`items.${index}.rate`, selectedItem.unitPrice)
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Item" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {itemsList.map(i => (
                                                                    <SelectItem key={i.id} value={i.id}>{i.itemName} ({i.itemCode})</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.unit`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input {...field} readOnly className="bg-muted" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.rate`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center h-10 px-3 border rounded-md bg-muted font-medium text-sm">
                                            {(watchItems?.[index]?.quantity || 0) * (watchItems?.[index]?.rate || 0)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" type="button" onClick={() => remove(index)} className="text-destructive hover:text-destructive/90">
                                            <IconTrash className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="p-4 border-t bg-muted/20 flex justify-between items-center">
                        <Button variant="outline" size="sm" type="button" onClick={() => append({ itemId: "", unit: "", quantity: 0, rate: 0, amount: 0 })}>
                            <IconPlus className="mr-2 size-4" />
                            Add Item
                        </Button>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-muted-foreground mr-2">Total Amount:</span>
                            <span className="text-xl font-bold">৳ {calculateTotal().toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Remarks</FormLabel>
                            <FormControl>
                                <Input placeholder="Additional notes..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" size="lg" disabled={submitting}>
                        {submitting && <IconLoader2 className="animate-spin size-4 mr-2" />}
                        Save GRN
                    </Button>
                </div>
            </form>
        </Form>
    )
}
