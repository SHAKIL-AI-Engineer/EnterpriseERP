"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconWorld,
  IconMapPin,
  IconBuildingCommunity,
  IconMapPins,
  IconMailbox,
  IconPlus,
  IconRefresh,
  IconDownload,
  IconUpload,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  addressService,
  parseOptionalEntityId,
  Country,
  Division,
  District,
  Thana,
  PostOffice,
  BangladeshAddressDirectoryRow,
} from "@/lib/services/address";
import { importExportService } from "@/lib/services/import-export";
import { toast } from "sonner";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function BilingualName({ bn, en }: { bn?: string; en: string }) {
  const banglaName = bn?.trim();
  return (
    <div className="min-w-32">
      <div lang="bn" className="font-medium">{banglaName || "বাংলা নাম নেই"}</div>
      {en.trim() && en.trim() !== banglaName && (
        <div className="text-xs text-muted-foreground">{en}</div>
      )}
    </div>
  );
}

export default function AddressManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("division");
  const [isLoading, setIsLoading] = React.useState(true);

  // Data states
  const [countries, setCountries] = React.useState<Country[]>([]);
  const [divisions, setDivisions] = React.useState<Division[]>([]);
  const [districts, setDistricts] = React.useState<District[]>([]);
  const [thanas, setThanas] = React.useState<Thana[]>([]);
  const [postOffices, setPostOffices] = React.useState<PostOffice[]>([]);
  const [directoryRows, setDirectoryRows] = React.useState<BangladeshAddressDirectoryRow[]>([]);
  const [directorySearch, setDirectorySearch] = React.useState("");
  const [isDirectoryLoading, setIsDirectoryLoading] = React.useState(false);

  // Selection states for filtering
  const [selectedCountryId, setSelectedCountryId] =
    React.useState<string>("all");
  const [selectedDivisionId, setSelectedDivisionId] =
    React.useState<string>("all");
  const [selectedDistrictId, setSelectedDistrictId] =
    React.useState<string>("all");

  // CRUD Modal states
  const [isCountryModalOpen, setIsCountryModalOpen] = React.useState(false);
  const [isDivisionModalOpen, setIsDivisionModalOpen] = React.useState(false);
  const [isDistrictModalOpen, setIsDistrictModalOpen] = React.useState(false);
  const [isThanaModalOpen, setIsThanaModalOpen] = React.useState(false);
  const [isPostOfficeModalOpen, setIsPostOfficeModalOpen] =
    React.useState(false);

  const [editingItem, setEditingItem] = React.useState<any>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Delete Alert state
  const [deleteItem, setDeleteItem] = React.useState<{
    id: string;
    type: string;
  } | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const countriesData = await addressService.getCountries();
      setCountries(countriesData);

      const divisionsData = await addressService.getDivisions();
      setDivisions(divisionsData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load address data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    let isCurrent = true;
    const fetchRelated = async () => {
      try {
        if (activeTab === "division") {
          const cId = parseOptionalEntityId(selectedCountryId);
          const data = await addressService.getDivisions(cId);
          setDivisions(data);
        } else if (activeTab === "district") {
          const dId = parseOptionalEntityId(selectedDivisionId);
          const data = await addressService.getDistricts(dId);
          setDistricts(data);
        } else if (activeTab === "thana") {
          const dId = parseOptionalEntityId(selectedDistrictId);
          const data = await addressService.getThanas(dId);
          setThanas(data);
        } else if (activeTab === "postoffice") {
          const dId = parseOptionalEntityId(selectedDistrictId);
          const data = await addressService.getPostOffices(
            dId != null ? { districtId: dId } : undefined,
          );
          setPostOffices(data);
        } else if (activeTab === "directory") {
          setIsDirectoryLoading(true);
          const data = await addressService.getBangladeshDirectory(directorySearch);
          if (isCurrent) setDirectoryRows(data);
        }
      } catch (error) {
        console.error(error);
        if (isCurrent) toast.error("Failed to load address data");
      } finally {
        if (isCurrent) setIsDirectoryLoading(false);
      }
    };
    fetchRelated();
    return () => { isCurrent = false; };
  }, [activeTab, selectedCountryId, selectedDivisionId, selectedDistrictId, directorySearch]);

  const handleSaveCountry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const nameEn = formData.get("nameEn") as string;
    const nameBn = formData.get("nameBn") as string;
    const code = (formData.get("code") as string).trim().toUpperCase();

    try {
      if (editingItem) {
        await addressService.updateCountry(editingItem.id, {
          nameEn,
          nameBn,
          code,
        });
        toast.success("Country updated");
      } else {
        await addressService.createCountry({ nameEn, nameBn, code });
        toast.success("Country created");
      }
      setIsCountryModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to save country");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDivision = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const nameEn = formData.get("nameEn") as string;
    const nameBn = formData.get("nameBn") as string;
    const countryId = formData.get("countryId") as string;

    try {
      if (editingItem) {
        await addressService.updateDivision(editingItem.id, {
          nameEn,
          nameBn,
          countryId,
        });
        toast.success("Division updated");
      } else {
        await addressService.createDivision({ nameEn, nameBn, countryId });
        toast.success("Division created");
      }
      setIsDivisionModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to save division");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDistrict = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const nameEn = formData.get("nameEn") as string;
    const nameBn = formData.get("nameBn") as string;
    const divisionId = formData.get("divisionId") as string;

    try {
      if (editingItem) {
        await addressService.updateDistrict(editingItem.id, {
          nameEn,
          nameBn,
          divisionId,
        });
        toast.success("District updated");
      } else {
        await addressService.createDistrict({ nameEn, nameBn, divisionId });
        toast.success("District created");
      }
      setIsDistrictModalOpen(false);
      const data = await addressService.getDistricts(
        parseOptionalEntityId(selectedDivisionId),
      );
      setDistricts(data);
    } catch (error) {
      toast.error("Failed to save district");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveThana = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const nameEn = formData.get("nameEn") as string;
    const nameBn = formData.get("nameBn") as string;
    const districtId = formData.get("districtId") as string;

    try {
      if (editingItem) {
        await addressService.updateThana(editingItem.id, {
          nameEn,
          nameBn,
          districtId,
        });
        toast.success("Thana updated");
      } else {
        await addressService.createThana({ nameEn, nameBn, districtId });
        toast.success("Thana created");
      }
      setIsThanaModalOpen(false);
      const data = await addressService.getThanas(
        parseOptionalEntityId(selectedDistrictId),
      );
      setThanas(data);
    } catch (error) {
      toast.error("Failed to save thana");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePostOffice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const nameEn = formData.get("nameEn") as string;
    const nameBn = formData.get("nameBn") as string;
    const postalCode = formData.get("postalCode") as string;
    const upazilaId = formData.get("upazilaId") as string;

    try {
      if (editingItem) {
        await addressService.updatePostOffice(editingItem.id, {
          nameEn,
          nameBn,
          postalCode,
          upazilaId,
        });
        toast.success("Post Office updated");
      } else {
        await addressService.createPostOffice({
          nameEn,
          nameBn,
          postalCode,
          upazilaId,
        });
        toast.success("Post Office created");
      }
      setIsPostOfficeModalOpen(false);
      const filterDistrictId = parseOptionalEntityId(selectedDistrictId);
      const data = await addressService.getPostOffices(
        filterDistrictId ? { districtId: filterDistrictId } : undefined,
      );
      setPostOffices(data);
    } catch (error) {
      toast.error("Failed to save post office");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      const { id, type } = deleteItem;
      if (type === "country") await addressService.deleteCountry(id);
      else if (type === "division") await addressService.deleteDivision(id);
      else if (type === "district") await addressService.deleteDistrict(id);
      else if (type === "thana") await addressService.deleteThana(id);
      else if (type === "postoffice") await addressService.deletePostOffice(id);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`);

      if (type === "country" || type === "division") {
        fetchData();
      } else if (type === "district") {
        const data = await addressService.getDistricts(
          parseOptionalEntityId(selectedDivisionId),
        );
        setDistricts(data);
      } else if (type === "thana") {
        const data = await addressService.getThanas(
          parseOptionalEntityId(selectedDistrictId),
        );
        setThanas(data);
      } else if (type === "postoffice") {
        const data = await addressService.getPostOffices(
          parseOptionalEntityId(selectedDistrictId)
            ? { districtId: parseOptionalEntityId(selectedDistrictId)! }
            : undefined,
        );
        setPostOffices(data);
      }

      setDeleteItem(null);
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleExportTemplate = async () => {
    try {
      await importExportService.downloadAddressDemo();
      toast.success("Template downloaded");
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  const countryColumns: ColumnDef<Country>[] = [
    {
      id: "sl",
      header: "SL",
      cell: ({ row }) => (
        <div className="text-left font-medium">{row.index + 1}</div>
      ),
    },
    { accessorKey: "nameEn", header: "Country Name (EN)" },
    { accessorKey: "nameBn", header: "Country Name (BN)" },
    { accessorKey: "code", header: "Code" },
  ];

  const divisionColumns: ColumnDef<Division>[] = [
    {
      id: "sl",
      header: "SL",
      cell: ({ row }) => (
        <div className="text-left font-medium">{row.index + 1}</div>
      ),
    },
    { accessorKey: "nameEn", header: "Division Name (EN)" },
    { accessorKey: "nameBn", header: "Division Name (BN)" },
    { accessorKey: "countryName", header: "Country" },
  ];

  const districtColumns: ColumnDef<District>[] = [
    {
      id: "sl",
      header: "SL",
      cell: ({ row }) => (
        <div className="text-left font-medium">{row.index + 1}</div>
      ),
    },
    { accessorKey: "nameEn", header: "District Name (EN)" },
    { accessorKey: "nameBn", header: "District Name (BN)" },
    { accessorKey: "divisionName", header: "Division" },
  ];

  const thanaColumns: ColumnDef<Thana>[] = [
    {
      id: "sl",
      header: "SL",
      cell: ({ row }) => (
        <div className="text-left font-medium">{row.index + 1}</div>
      ),
    },
    { accessorKey: "nameEn", header: "Thana Name (EN)" },
    { accessorKey: "nameBn", header: "Thana Name (BN)" },
    { accessorKey: "districtName", header: "District" },
  ];

  const postOfficeColumns: ColumnDef<PostOffice>[] = [
    {
      id: "sl",
      header: "SL",
      cell: ({ row }) => (
        <div className="text-left font-medium">{row.index + 1}</div>
      ),
    },
    { accessorKey: "nameEn", header: "Post Office Name (EN)" },
    {
      id: "postOfficeBn",
      header: "Post Office Name (BN)",
      cell: ({ row }) => <BilingualName bn={row.original.nameBn} en={row.original.nameEn} />,
    },
    { accessorKey: "postalCode", header: "Post Code" },
    { accessorKey: "upazilaName", header: "Thana" },
  ];

  const directoryColumns: ColumnDef<BangladeshAddressDirectoryRow>[] = [
    {
      id: "country",
      header: "Country / দেশ",
      cell: ({ row }) => <BilingualName bn={row.original.countryNameBn} en={row.original.countryNameEn} />,
    },
    {
      id: "division",
      header: "Division / বিভাগ",
      cell: ({ row }) => <BilingualName bn={row.original.divisionNameBn} en={row.original.divisionNameEn} />,
    },
    {
      id: "district",
      header: "District / জেলা",
      cell: ({ row }) => <BilingualName bn={row.original.districtNameBn} en={row.original.districtNameEn} />,
    },
    {
      id: "upazila",
      header: "Upazila / উপজেলা",
      cell: ({ row }) => <BilingualName bn={row.original.upazilaNameBn} en={row.original.upazilaNameEn} />,
    },
    {
      id: "postOffice",
      header: "Post Office / ডাকঘর",
      cell: ({ row }) => <BilingualName bn={row.original.postOfficeNameBn} en={row.original.postOfficeNameEn} />,
    },
    { accessorKey: "postalCode", header: "Post Code / পোস্ট কোড" },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold">Address Management</h1>
          <p className="text-sm text-gray-500">
            Manage geographical locations and hierarchy
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push("/management/information/address-management/import")
            }
          >
            <IconUpload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportTemplate}>
            <IconDownload className="mr-2 h-4 w-4" /> Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <IconRefresh
              className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}
            />{" "}
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b rounded-none h-auto p-0 mb-6 flex justify-start gap-4">
          {[
            { val: "country", icon: IconWorld, label: "Country" },
            { val: "division", icon: IconMapPin, label: "Division" },
            { val: "district", icon: IconBuildingCommunity, label: "District" },
            { val: "thana", icon: IconMapPins, label: "Thana" },
            { val: "postoffice", icon: IconMailbox, label: "Post Office" },
            { val: "directory", icon: IconMapPins, label: "Full Address Directory" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.val}
              value={tab.val}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 font-semibold text-gray-500 data-[state=active]:text-primary hover:text-gray-700 h-full"
            >
              <div className="flex items-center gap-2">
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="flex flex-wrap gap-4">
              {activeTab === "division" && (
                <div className="space-y-1">
                  <Label className="text-xs uppercase font-bold text-gray-400">
                    Country Filter
                  </Label>
                  <NativeSelect
                    value={selectedCountryId}
                    onChange={(e) => setSelectedCountryId(e.target.value)}
                    className="w-[180px]"
                  >
                    <option value="all">All Countries</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id.toString()}>
                        {c.nameBn ? `${c.nameBn} (${c.nameEn})` : c.nameEn}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              )}
              {activeTab === "district" && (
                <div className="space-y-1">
                  <Label className="text-xs uppercase font-bold text-gray-400">
                    Division Filter
                  </Label>
                  <NativeSelect
                    value={selectedDivisionId}
                    onChange={(e) => setSelectedDivisionId(e.target.value)}
                    className="w-[180px]"
                  >
                    <option value="all">All Divisions</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id.toString()}>
                        {d.nameBn ? `${d.nameBn} (${d.nameEn})` : d.nameEn}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              )}
              {(activeTab === "thana" || activeTab === "postoffice") && (
                <div className="space-y-1">
                  <Label className="text-xs uppercase font-bold text-gray-400">
                    District Filter
                  </Label>
                  <NativeSelect
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    className="w-[180px]"
                  >
                    <option value="all">All Districts</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id.toString()}>
                        {d.nameBn ? `${d.nameBn} (${d.nameEn})` : d.nameEn}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              )}
              {activeTab === "directory" && (
                <div className="space-y-1">
                  <Label className="text-xs uppercase font-bold text-gray-400">
                    Search all Bangladesh addresses
                  </Label>
                  <Input
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    placeholder="Post code, ডাকঘর, উপজেলা, জেলা, বিভাগ..."
                    className="w-[min(560px,80vw)]"
                  />
                </div>
              )}
            </div>
            {activeTab !== "directory" && <Button
              onClick={() => {
                setEditingItem(null);
                if (activeTab === "country") setIsCountryModalOpen(true);
                else if (activeTab === "division") setIsDivisionModalOpen(true);
                else if (activeTab === "district") setIsDistrictModalOpen(true);
                else if (activeTab === "thana") setIsThanaModalOpen(true);
                else if (activeTab === "postoffice")
                  setIsPostOfficeModalOpen(true);
              }}
              className="gap-2"
            >
              <IconPlus size={18} /> Add{" "}
              {activeTab === "postoffice"
                ? "Post Office"
                : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </Button>}
          </div>

          <Card className="border shadow-none overflow-hidden">
            <TabsContent
              value="country"
              className="m-0 border-none shadow-none"
            >
              <DataTable
                data={countries}
                columns={countryColumns}
                showTabs={false}
                isLoading={isLoading}
                onEditClick={(item) => {
                  setEditingItem(item);
                  setIsCountryModalOpen(true);
                }}
                onDelete={(item: any) =>
                  setDeleteItem({ id: item.id, type: "country" })
                }
              />
            </TabsContent>
            <TabsContent
              value="division"
              className="m-0 border-none shadow-none"
            >
              <DataTable
                data={divisions}
                columns={divisionColumns}
                showTabs={false}
                isLoading={isLoading}
                onEditClick={(item) => {
                  setEditingItem(item);
                  setIsDivisionModalOpen(true);
                }}
                onDelete={(item: any) =>
                  setDeleteItem({ id: item.id, type: "division" })
                }
              />
            </TabsContent>
            <TabsContent
              value="district"
              className="m-0 border-none shadow-none"
            >
              <DataTable
                data={districts}
                columns={districtColumns}
                showTabs={false}
                isLoading={isLoading}
                onEditClick={(item) => {
                  setEditingItem(item);
                  setIsDistrictModalOpen(true);
                }}
                onDelete={(item: any) =>
                  setDeleteItem({ id: item.id, type: "district" })
                }
              />
            </TabsContent>
            <TabsContent value="thana" className="m-0 border-none shadow-none">
              <DataTable
                data={thanas}
                columns={thanaColumns}
                showTabs={false}
                isLoading={isLoading}
                onEditClick={(item) => {
                  setEditingItem(item);
                  setIsThanaModalOpen(true);
                }}
                onDelete={(item: any) =>
                  setDeleteItem({ id: item.id, type: "thana" })
                }
              />
            </TabsContent>
            <TabsContent
              value="postoffice"
              className="m-0 border-none shadow-none"
            >
              <DataTable
                data={postOffices}
                columns={postOfficeColumns}
                showTabs={false}
                isLoading={isLoading}
                onEditClick={(item) => {
                  setEditingItem(item);
                  setIsPostOfficeModalOpen(true);
                }}
                onDelete={(item: any) =>
                  setDeleteItem({ id: item.id, type: "postoffice" })
                }
              />
            </TabsContent>
            <TabsContent
              value="directory"
              className="m-0 border-none shadow-none"
            >
              <div className="border-b px-4 py-3 text-sm text-muted-foreground">
                {directoryRows.length.toLocaleString()} postal records with their complete relational path from Bangladesh through division, district and upazila to post office.
              </div>
              <DataTable
                data={directoryRows}
                columns={directoryColumns}
                showTabs={false}
                isLoading={isDirectoryLoading}
              />
            </TabsContent>
          </Card>
        </div>
      </Tabs>

      {/* Modals remain mostly the same but with standard UI */}
      {/* Country Modal */}
      <Dialog open={isCountryModalOpen} onOpenChange={setIsCountryModalOpen}>
        <DialogContent>
          <form onSubmit={handleSaveCountry}>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Country" : "New Country"}
              </DialogTitle>
              <DialogDescription>Enter country details below</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="country-name">Name (English)</Label>
                <Input
                  id="country-name"
                  name="nameEn"
                  defaultValue={editingItem?.nameEn}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country-name-bn">Name (Bangla)</Label>
                <Input
                  id="country-name-bn"
                  name="nameBn"
                  defaultValue={editingItem?.nameBn}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country-code">Code (ISO)</Label>
                <Input
                  id="country-code"
                  name="code"
                  defaultValue={editingItem?.code}
                  placeholder="e.g. BD"
                  maxLength={10}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCountryModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Division Modal */}
      <Dialog open={isDivisionModalOpen} onOpenChange={setIsDivisionModalOpen}>
        <DialogContent>
          <form onSubmit={handleSaveDivision}>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Division" : "New Division"}
              </DialogTitle>
              <DialogDescription>
                Enter division details below
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid gap-2">
                <Label>Country</Label>
                <NativeSelect
                  name="countryId"
                  defaultValue={editingItem?.countryId}
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Name (English)</Label>
                <Input
                  name="nameEn"
                  defaultValue={editingItem?.nameEn}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Name (Bangla)</Label>
                <Input name="nameBn" defaultValue={editingItem?.nameBn} />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsDivisionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* District Modal */}
      <Dialog open={isDistrictModalOpen} onOpenChange={setIsDistrictModalOpen}>
        <DialogContent>
          <form onSubmit={handleSaveDistrict}>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit District" : "New District"}
              </DialogTitle>
              <DialogDescription>
                Enter district details below
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid gap-2">
                <Label>Division</Label>
                <NativeSelect
                  name="divisionId"
                  defaultValue={editingItem?.divisionId}
                  required
                >
                  <option value="">Select Division</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameEn}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Name (English)</Label>
                <Input
                  name="nameEn"
                  defaultValue={editingItem?.nameEn}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Name (Bangla)</Label>
                <Input name="nameBn" defaultValue={editingItem?.nameBn} />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsDistrictModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Thana Modal */}
      <Dialog open={isThanaModalOpen} onOpenChange={setIsThanaModalOpen}>
        <DialogContent>
          <form onSubmit={handleSaveThana}>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Thana" : "New Thana"}
              </DialogTitle>
              <DialogDescription>Enter Thana details below</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid gap-2">
                <Label>District</Label>
                <NativeSelect
                  name="districtId"
                  defaultValue={editingItem?.districtId}
                  required
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameEn}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Name (English)</Label>
                <Input
                  name="nameEn"
                  defaultValue={editingItem?.nameEn}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Name (Bangla)</Label>
                <Input name="nameBn" defaultValue={editingItem?.nameBn} />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsThanaModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Post Office Modal */}
      <Dialog
        open={isPostOfficeModalOpen}
        onOpenChange={setIsPostOfficeModalOpen}
      >
        <DialogContent>
          <form onSubmit={handleSavePostOffice}>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Post Office" : "New Post Office"}
              </DialogTitle>
              <DialogDescription>
                Enter Post Office details below
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid gap-2">
                <Label>Thana / Upazila</Label>
                <NativeSelect
                  name="upazilaId"
                  defaultValue={editingItem?.upazilaId}
                  required
                >
                  <option value="">Select Thana</option>
                  {thanas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameEn}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Name (English)</Label>
                <Input
                  name="nameEn"
                  defaultValue={editingItem?.nameEn}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Name (Bangla)</Label>
                <Input name="nameBn" defaultValue={editingItem?.nameBn} />
              </div>
              <div className="grid gap-2">
                <Label>Post Code</Label>
                <Input
                  name="postalCode"
                  defaultValue={editingItem?.postalCode ?? editingItem?.code}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsPostOfficeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog
        open={deleteItem !== null}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the <b>{deleteItem?.type}</b> permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
