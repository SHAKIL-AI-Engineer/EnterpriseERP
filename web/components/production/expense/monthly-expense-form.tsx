"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

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

const formSchema = z.object({
    month: z.string().min(1, "Month is required."),
    year: z.number().min(2000, "Year must be valid."),
    materialCost: z.number().min(0, "Cost must be positive."),
    laborCost: z.number().min(0, "Cost must be positive."),
    overheadCost: z.number().min(0, "Cost must be positive."),
    status: z.string().min(1, "Status is required."),
})

interface MonthlyExpenseFormProps {
    initialData?: z.infer<typeof formSchema>
    onSubmit: (values: z.infer<typeof formSchema>) => void
    onCancel: () => void
}

export function MonthlyExpenseForm({ initialData, onSubmit, onCancel }: MonthlyExpenseFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            month: "",
            year: new Date().getFullYear(),
            materialCost: 0,
            laborCost: 0,
            overheadCost: 0,
            status: "Provisional",
        },
    })

    // Calculate total expense dynamically? 
    // For a simple form, we might just display it or let backend handle it.
    // Ideally, totalExpense is a derived field, not an input.

    function handleSubmit(values: z.infer<typeof formSchema>) {
        // Add totalExpense calculation before submitting if needed by the consumer
        const totalExpense = values.materialCost + values.laborCost + values.overheadCost;
        onSubmit({ ...values, totalExpense } as any)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="month"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Month</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Month" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Year</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={e => field.onChange(+e.target.value)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="materialCost"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Material Cost</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    onChange={e => field.onChange(+e.target.value)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="laborCost"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Labor Cost</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    onChange={e => field.onChange(+e.target.value)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="overheadCost"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Overhead Cost</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    onChange={e => field.onChange(+e.target.value)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Provisional">Provisional</SelectItem>
                                    <SelectItem value="Finalized">Finalized</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </div>
            </form>
        </Form>
    )
}
