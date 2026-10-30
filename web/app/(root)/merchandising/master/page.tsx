"use client"

import Link from "next/link"
import { IconDatabase } from "@tabler/icons-react"
import { MerchCompanyGate, MerchPageShell, MerchPageHeader } from "@/components/merchandising"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const LINKS = [
  { href: "/merchandising/master/sizes", label: "Sizes", hint: "Size codes for matrices" },
  { href: "/merchandising/master/units", label: "Units", hint: "UOM for BOM and bookings" },
  { href: "/merchandising/master/suppliers", label: "Suppliers", hint: "Material suppliers" },
  { href: "/merchandising/master/fabric-types", label: "Fabric Types", hint: "Fabric classifications" },
  { href: "/merchandising/master/trims-types", label: "Trims Types", hint: "Accessory categories" },
  { href: "/merchandising/master/size-ratios", label: "Size Ratios", hint: "Ratio templates" },
  { href: "/merchandising/master/garment-categories", label: "Garment Categories", hint: "Product categories" },
  { href: "/merchandising/master/currencies", label: "Currencies", hint: "Currency codes" },
  { href: "/merchandising/colors", label: "Colors (full library)", hint: "Includes CSV import" },
  { href: "/merchandising/brands", label: "Brands", hint: "Buyer-linked brands" },
]

export default function MasterDataHubPage() {
  return (
    <MerchCompanyGate>
      {() => (
        <MerchPageShell>
          <MerchPageHeader
            icon={<IconDatabase className="size-6" />}
            title="Reference Data"
            description="Master lists used across styles, orders, and material bookings."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LINKS.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="h-full hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{item.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{item.hint}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </MerchPageShell>
      )}
    </MerchCompanyGate>
  )
}
