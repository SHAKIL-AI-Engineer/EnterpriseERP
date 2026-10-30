"use client";

import * as React from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ColorSizeRow } from "@/components/merchandising/ColorSizeMatrix";

export type EditableColorSizeRow = ColorSizeRow & { id?: string };

type ColorSizeMatrixEditorProps = {
  rows: EditableColorSizeRow[];
  onChange: (rows: EditableColorSizeRow[]) => void;
  disabled?: boolean;
};

export function ColorSizeMatrixEditor({
  rows,
  onChange,
  disabled = false,
}: ColorSizeMatrixEditorProps) {
  const totalQty = rows.reduce((sum, r) => sum + (r.quantity || 0), 0);

  const updateRow = (index: number, patch: Partial<EditableColorSizeRow>) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    onChange([...rows, { colorName: "", sizeName: "", quantity: 0 }]);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Color / size breakdown</span>
        <span className="text-xs text-muted-foreground">Total: {totalQty.toLocaleString()} pcs</span>
      </div>
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={row.id ?? idx} className="grid grid-cols-12 gap-2 items-center">
            <Input
              className="col-span-4 h-9"
              placeholder="Color"
              value={row.colorName}
              disabled={disabled}
              onChange={(e) => updateRow(idx, { colorName: e.target.value })}
            />
            <Input
              className="col-span-3 h-9"
              placeholder="Size"
              value={row.sizeName}
              disabled={disabled}
              onChange={(e) => updateRow(idx, { sizeName: e.target.value })}
            />
            <Input
              className="col-span-3 h-9"
              type="number"
              min={0}
              placeholder="Qty"
              value={row.quantity || ""}
              disabled={disabled}
              onChange={(e) =>
                updateRow(idx, { quantity: parseInt(e.target.value, 10) || 0 })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="col-span-2 h-9 text-destructive"
              disabled={disabled || rows.length <= 1}
              onClick={() => removeRow(idx)}
            >
              <IconTrash className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="gap-2" disabled={disabled} onClick={addRow}>
        <IconPlus className="size-4" />
        Add row
      </Button>
    </div>
  );
}
