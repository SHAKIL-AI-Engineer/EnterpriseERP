"use client"

import * as React from "react"
import { IconHierarchy, IconPlus, IconSearch, IconLoader2 } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { StorePageShell, StoreCompanyGate } from "@/components/store"
import { storeService } from "@/lib/services/store"
import type { ItemCategory } from "@/lib/types/store"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

function ItemCategoryContent({ companyId }: { companyId: string }) {
    const [categories, setCategories] = React.useState<ItemCategory[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [newCategory, setNewCategory] = React.useState({ categoryName: "", description: "" });
    const [submitting, setSubmitting] = React.useState(false);

    const fetchCategories = async () => {
        try {
            const data = await storeService.getCategories(companyId);
            setCategories(data);
        } catch {
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchCategories();
    }, [companyId]);

    const handleAddCategory = async () => {
        if (!newCategory.categoryName) {
            toast.error("Category name is required");
            return;
        }

        setSubmitting(true);
        try {
            await storeService.addCategory({ ...newCategory, companyId });
            toast.success("Category added successfully");
            setIsDialogOpen(false);
            setNewCategory({ categoryName: "", description: "" });
            fetchCategories();
        } catch {
            toast.error("Failed to add category");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.categoryName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                        <IconHierarchy className="size-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Item Category</h1>
                        <p className="text-muted-foreground text-sm">Organize your inventory with logical categories.</p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <IconPlus className="size-4" /> Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Category</DialogTitle>
                            <DialogDescription>Create a new classification for your store items.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Category Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Raw Material"
                                    value={newCategory.categoryName}
                                    onChange={(e) => setNewCategory({ ...newCategory, categoryName: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="desc">Description (Optional)</Label>
                                <Input
                                    id="desc"
                                    placeholder="Brief details about this category"
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddCategory} disabled={submitting}>
                                {submitting ? <IconLoader2 className="animate-spin size-4 mr-2" /> : null}
                                Save Category
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Catalog Categories</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-6">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                        <Input
                            placeholder="Search categories..."
                            className="pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-bold">Category Name</TableHead>
                                    <TableHead className="font-bold">Description</TableHead>
                                    <TableHead className="font-bold">Status</TableHead>
                                    <TableHead className="text-right font-bold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <IconLoader2 className="animate-spin size-6 mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCategories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No categories found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCategories.map((cat) => (
                                        <TableRow key={cat.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-semibold">{cat.categoryName}</TableCell>
                                            <TableCell className="text-muted-foreground max-w-xs truncate">{cat.description || "—"}</TableCell>
                                            <TableCell>
                                                <Badge variant={cat.isActive ? "default" : "secondary"} className={cat.isActive ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none" : ""}>
                                                    {cat.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="hover:text-primary">Edit</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

export default function ItemCategoryPage() {
    return (
        <StorePageShell>
            <StoreCompanyGate>
                {(companyId) => <ItemCategoryContent companyId={companyId} />}
            </StoreCompanyGate>
        </StorePageShell>
    );
}
