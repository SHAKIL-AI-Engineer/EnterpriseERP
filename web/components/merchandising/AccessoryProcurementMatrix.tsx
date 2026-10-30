"use client"

import * as React from "react"
import { merchandisingService } from "@/lib/services/merchandising"
import type { ProgramOrderWorksheet, MasterDataDto } from "@/lib/types/merchandising"
import { format } from "date-fns"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MerchTableCard } from "@/components/merchandising"

export interface AccessoryProcurementMatrixProps {
  companyId: string
  orderId: string
  title?: string
}

export default function AccessoryProcurementMatrix({
  companyId,
  orderId,
  title = "Trims",
}: AccessoryProcurementMatrixProps) {
  const [worksheet, setWorksheet] = React.useState<ProgramOrderWorksheet | null>(null)
  const [masterColors, setMasterColors] = React.useState<MasterDataDto[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchData = React.useCallback(async () => {
    if (!orderId) return
    try {
      setLoading(true)
      const [worksheetData, colorsData] = await Promise.all([
        merchandisingService.getOrderWorksheet(orderId),
        merchandisingService.getMasterData("colors", companyId),
      ])
      setWorksheet(worksheetData)
      setMasterColors(colorsData)
    } catch (error) {
      console.error(error)
      toast.error(`Failed to fetch ${title} procurement matrix`)
    } finally {
      setLoading(false)
    }
  }, [orderId, companyId, title])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <MerchTableCard isLoading loadingMessage={`Loading ${title} matrix...`}>
        <div />
      </MerchTableCard>
    )
  }

  if (!worksheet) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">Worksheet data unavailable for this order.</p>
    )
  }

  const programTotal = worksheet.articles.reduce((acc, item) => acc + item.totalQty, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl border bg-muted/20">
        <div>
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Program</Label>
          <p className="text-sm font-bold">{worksheet.programNumber}</p>
        </div>
        <div>
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Buyer</Label>
          <p className="text-sm font-bold">{worksheet.buyerName}</p>
        </div>
        <div>
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Status</Label>
          <p className="text-sm font-bold">{worksheet.orderStatus}</p>
        </div>
        <div>
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Order Date</Label>
          <p className="text-sm font-bold">
            {worksheet.orderDate ? format(new Date(worksheet.orderDate), "dd MMM yyyy") : "N/A"}
          </p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-primary text-primary-foreground font-bold uppercase text-[10px] text-center">
              <th className="p-3 border-r">Style</th>
              <th className="p-3 border-r">Garment Color</th>
              <th className="p-3 border-r">Size</th>
              <th className="p-3 border-r">Qty to Book</th>
              <th className="p-3">{title} Color Spec</th>
            </tr>
          </thead>
          <tbody>
            {worksheet.articles.flatMap((article) =>
              article.colors.flatMap((color) =>
                color.sizeBreakdowns.map((sb, idx) => (
                  <tr
                    key={`${article.styleNo}-${color.colorName}-${sb.sizeName}-${idx}`}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="p-2 text-center font-bold uppercase text-primary">{article.styleNo}</td>
                    <td className="p-2 font-semibold uppercase pl-4">{color.colorName}</td>
                    <td className="p-2 text-center">{sb.sizeName}</td>
                    <td className="p-2 text-center font-bold bg-orange-50 dark:bg-orange-950/20 text-orange-700">
                      {sb.quantity}
                    </td>
                    <td className="p-2">
                      <Select disabled>
                        <SelectTrigger className="h-8 text-[10px] font-semibold uppercase">
                          <SelectValue placeholder="SELECT COLOR" />
                        </SelectTrigger>
                        <SelectContent>
                          {masterColors.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                )),
              ),
            )}
          </tbody>
          <tfoot>
            <tr className="bg-muted font-bold uppercase text-[10px]">
              <td colSpan={3} className="p-3 text-left">
                Total Order Quantity
              </td>
              <td className="p-3 text-center bg-orange-600 text-white">{programTotal.toLocaleString()} PCS</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
