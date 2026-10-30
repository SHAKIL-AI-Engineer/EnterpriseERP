"use client";

import * as React from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type LineItemRow = {
  itemName: string;
  itemDescription?: string;
  unitName?: string;
  quantity: string;
  remarks?: string;
};

type LineItemsEditorProps = {
  items: LineItemRow[];
  onChange: (items: LineItemRow[]) => void;
  showDescription?: boolean;
};

const emptyRow = (): LineItemRow => ({
  itemName: "",
  unitName: "",
  quantity: "1",
  remarks: "",
});

export function LineItemsEditor({ items, onChange, showDescription = false }: LineItemsEditorProps) {
  const update = (index: number, patch: Partial<LineItemRow>) => {
    onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Line items</span>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, emptyRow()])}>
          <IconPlus className="size-4 mr-1" />
          Add row
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items yet. Add at least one line.</p>
      ) : (
        <div className="space-y-2">
          {items.map((row, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-start">
              <Input
                className="col-span-4"
                placeholder="Item name"
                value={row.itemName}
                onChange={(e) => update(index, { itemName: e.target.value })}
              />
              {showDescription && (
                <Input
                  className="col-span-3"
                  placeholder="Description"
                  value={row.itemDescription ?? ""}
                  onChange={(e) => update(index, { itemDescription: e.target.value })}
                />
              )}
              <Input
                className={showDescription ? "col-span-2" : "col-span-3"}
                placeholder="Unit"
                value={row.unitName ?? ""}
                onChange={(e) => update(index, { unitName: e.target.value })}
              />
              <Input
                className="col-span-2"
                type="number"
                min="0"
                step="any"
                placeholder="Qty"
                value={row.quantity}
                onChange={(e) => update(index, { quantity: e.target.value })}
              />
              <Input
                className="col-span-2"
                placeholder="Remarks"
                value={row.remarks ?? ""}
                onChange={(e) => update(index, { remarks: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="col-span-1 shrink-0"
                onClick={() => remove(index)}
              >
                <IconTrash className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function lineItemsToGatePassPayload(items: LineItemRow[]) {
  return items
    .filter((r) => r.itemName.trim())
    .map((r) => ({
      itemName: r.itemName.trim(),
      itemDescription: r.itemDescription?.trim() || null,
      unitName: r.unitName?.trim() || null,
      quantity: parseFloat(r.quantity) || 0,
      remarks: r.remarks?.trim() || null,
    }));
}

export function lineItemsToChalanPayload(items: LineItemRow[]) {
  return items
    .filter((r) => r.itemName.trim())
    .map((r) => ({
      itemName: r.itemName.trim(),
      unitName: r.unitName?.trim() || null,
      quantity: parseFloat(r.quantity) || 0,
      remarks: r.remarks?.trim() || null,
    }));
}
