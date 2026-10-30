"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
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
import { NativeSelect } from "@/components/ui/native-select"
import { expenseService, Expense } from "@/lib/services/expense"
import { toast } from "sonner"
import { DatePicker } from "@/components/ui/date-picker"

const formSchema = z.object({
    expenseDate: z.date(),
    category: z.string().min(1, "Category is required"),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    paymentMethod: z.string().optional(),
    referenceNumber: z.string().optional(),
    description: z.string().optional(),
    branch: z.string().optional(),
})

interface ExpenseDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    expense?: Expense
    onSuccess: () => void
}

const CATEGORIES = [
    "Office Supplies",
    "Salary",
    "Utility Bills",
    "Marketing",
    "Maintenance",
    "Rent",
    "Travel",
    "Others"
]

const PAYMENT_METHODS = [
    "Cash",
    "Bank Transfer",
    "Mobile Banking",
    "Cheque"
]

export function ExpenseDialog({ open, onOpenChange, expense, onSuccess }: ExpenseDialogProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            expenseDate: new Date(),
            category: "",
            amount: 0,
            paymentMethod: "Cash",
            referenceNumber: "",
            description: "",
            branch: "Main",
        },
    })

    React.useEffect(() => {
        if (expense) {
            form.reset({
                expenseDate: new Date(expense.expenseDate),
                category: expense.category,
                amount: Number(expense.amount),
                paymentMethod: expense.paymentMethod || "Cash",
                referenceNumber: expense.referenceNumber || "",
                description: expense.description || "",
                branch: expense.branch || "Main",
            })
        } else {
            form.reset({
                expenseDate: new Date(),
                category: "",
                amount: 0,
                paymentMethod: "Cash",
                referenceNumber: "",
                description: "",
                branch: "Main",
            })
        }
    }, [expense, form, open])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        try {
            const data = {
                ...values,
                expenseDate: values.expenseDate.toISOString(),
            }

            if (expense?.id) {
                await expenseService.update(expense.id as number, data as Expense)
                toast.success("Expense updated successfully")
            } else {
                await expenseService.create(data as Expense)
                toast.success("Expense added successfully")
            }
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{expense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="expenseDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date</FormLabel>
                                        <DatePicker
                                            date={field.value}
                                            setDate={field.onChange}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <FormControl>
                                            <NativeSelect {...field}>
                                                <option value="">Select Category</option>
                                                {CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </NativeSelect>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="paymentMethod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Method</FormLabel>
                                        <FormControl>
                                            <NativeSelect {...field}>
                                                {PAYMENT_METHODS.map(method => (
                                                    <option key={method} value={method}>{method}</option>
                                                ))}
                                            </NativeSelect>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="referenceNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reference #</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Invoice/Ref" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="branch"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Branch</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Note about the expense" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : expense ? "Update Expense" : "Add Expense"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
