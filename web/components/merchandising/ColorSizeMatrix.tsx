"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

export interface ColorSizeRow {
  colorName: string;
  sizeName: string;
  quantity: number;
}

interface ColorSizeMatrixProps {
  rows: ColorSizeRow[];
  className?: string;
}

export function ColorSizeMatrix({ rows, className }: ColorSizeMatrixProps) {
  const colors = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.colorName))),
    [rows],
  );
  const sizes = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.sizeName))),
    [rows],
  );

  const qtyMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(`${row.colorName}::${row.sizeName}`, row.quantity);
    }
    return map;
  }, [rows]);

  const totalQty = rows.reduce((sum, row) => sum + row.quantity, 0);

  if (rows.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">No color/size breakdown data.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">Color / Size Matrix</span>
        <Badge variant="secondary">{totalQty.toLocaleString()} pcs</Badge>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-3 py-2 text-left font-medium">Color</th>
              {sizes.map((size) => (
                <th key={size} className="px-3 py-2 text-right font-medium">
                  {size}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {colors.map((color) => {
              const rowTotal = sizes.reduce(
                (sum, size) => sum + (qtyMap.get(`${color}::${size}`) ?? 0),
                0,
              );
              return (
                <tr key={color} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{color}</td>
                  {sizes.map((size) => (
                    <td key={size} className="px-3 py-2 text-right tabular-nums">
                      {(qtyMap.get(`${color}::${size}`) ?? 0).toLocaleString()}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-medium tabular-nums">
                    {rowTotal.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ColorSizeMatrix;
