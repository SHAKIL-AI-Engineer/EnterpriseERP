"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
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
import { Textarea } from "@/components/ui/textarea"
import { storeService } from "@/lib/services/store"
import type { ItemCategory, StoreUnit } from "@/lib/types/store"
import { toast } from "sonner"

const formSchema = z.object({
    itemName: z.string().min(1, "Item name is required"),
    itemCode: z.string().min(1, "Item code is required"),
    categoryId: z.string().min(1, "Category is required"),
    unitId: z.string().min(1, "Unit is required"),
    minimumStockLevel: z.number().min(0, "Min stock level must be positive"),
    unitPrice: z.number().min(0),
    description: z.string().optional(),
})

interface ItemFormProps {
    companyId: string
    onSubmit: () => void
    onCancel: () => void
}

export function ItemForm({ companyId, onSubmit, onCancel }: ItemFormProps) {
    const [categories, setCategories] = React.useState<ItemCategory[]>([])
    const [units, setUnits] = React.useState<StoreUnit[]>([])
    const [loading, setLoading] = React.useState(true)
    const [submitting, setSubmitting] = React.useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            itemName: "",
            itemCode: "",
            categoryId: "",
            unitId: "",
            minimumStockLevel: 0,
            unitPrice: 0,
            description: "",
        },
    })

    React.useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [cats, unitData] = await Promise.all([
                    storeService.getCategories(companyId),
                    storeService.getUnits(companyId),
                ])
                setCategories(cats)
                setUnits(unitData)
            } catch {
                toast.error("Failed to load form data")
            } finally {
                setLoading(false)
            }
        }
        fetchLookups()
    }, [companyId])

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        setSubmitting(true)
        try {
            await storeService.addItem({
                companyId,
                itemCode: values.itemCode,
                itemName: values.itemName,
                categoryId: values.categoryId,
                unitId: values.unitId,
                openingStock: 0,
                minimumStockLevel: values.minimumStockLevel,
                unitPrice: values.unitPrice,
                description: values.description,
            })
            toast.success("Item created successfully")
            onSubmit()
        } catch {
            toast.error("Failed to create item")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <IconLoader2 className="animate-spin size-6 text-primary" />
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="itemCode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Item Code</FormLabel>
                            <FormControl>
                                <Input placeholder="ITM-001" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="itemName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Cotton 80s" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.categoryName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="unitId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unit</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {units.map(u => (
                                            <SelectItem key={u.id} value={u.id}>{u.unitName} ({u.shortName})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="minimumStockLevel"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Low Stock Alert Level</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={e => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                    />
                                </FormControl>
                                <FormDescription>System will alert when stock falls below this.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="unitPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unit Price</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={e => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Additional details..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting && <IconLoader2 className="animate-spin size-4 mr-2" />}
                        Save Item
                    </Button>
                </div>
            </form>
        </Form>
    )
}
