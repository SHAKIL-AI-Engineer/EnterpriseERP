"use client"

import { notFound } from "next/navigation"
import { useParams } from "next/navigation"
import { MerchCompanyGate } from "@/components/merchandising"
import {
  MerchMasterResourcePage,
  type MasterResourceMeta,
} from "@/components/merchandising/MerchMasterResourcePage"
import type { MasterDataResource } from "@/lib/types/merchandising"

const RESOURCE_META: Record<string, MasterResourceMeta> = {
  sizes: { resource: "sizes", title: "Sizes", description: "Size codes for color/size matrices and worksheets." },
  units: { resource: "units", title: "Units", description: "Units of measure for BOM and bookings." },
  suppliers: { resource: "suppliers", title: "Suppliers", description: "Supplier master for material bookings." },
  "fabric-types": { resource: "fabric-types", title: "Fabric Types", description: "Fabric classifications for bookings." },
  "trims-types": { resource: "trims-types", title: "Trims Types", description: "Trims and accessory categories." },
  "size-ratios": { resource: "size-ratios", title: "Size Ratios", description: "Default size ratio templates." },
  "garment-categories": {
    resource: "garment-categories",
    title: "Garment Categories",
    description: "Garment category reference data.",
  },
  currencies: { resource: "currencies", title: "Currencies", description: "Currency codes for orders and costing." },
}

function isMasterResource(value: string): value is MasterDataResource {
  return value in RESOURCE_META
}

export default function MasterResourcePage() {
  const params = useParams()
  const resource = params.resource as string

  if (!isMasterResource(resource)) {
    notFound()
  }

  const meta = RESOURCE_META[resource]

  return (
    <MerchCompanyGate>
      {(companyId) => <MerchMasterResourcePage companyId={companyId} meta={meta} />}
    </MerchCompanyGate>
  )
}
