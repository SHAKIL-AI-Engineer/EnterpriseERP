"use client"

import * as React from "react"
import { format, startOfDay, startOfMonth, subDays } from "date-fns"
import { DateRange } from "react-day-picker"
import { Label } from "@/components/ui/label"
import { DateRangePicker } from "@/components/ui/date-range-picker"

export type PunchDateRangePreset = "lastDays" | "currentMonthToToday"

/** First day of the current calendar month through today (local). */
export function getCurrentMonthToTodayRange(): DateRange {
  const today = startOfDay(new Date())
  return { from: startOfMonth(today), to: today }
}

export type PunchDateRangeValue = {
  from?: Date
  to?: Date
  fromIso?: string
  toIso?: string
}

/** Calendar-day bounds for punch queries (wall-clock, matches PunchData ParsePunchTime). */
function toPunchRangeIso(date: Date, endOfDay: boolean): string {
  const day = format(date, "yyyy-MM-dd")
  return endOfDay ? `${day}T23:59:59` : `${day}T00:00:00`
}

export function punchRangeToIso(range: DateRange | undefined): PunchDateRangeValue {
  if (!range?.from) return {}
  const from = range.from
  const to = range.to ?? range.from
  return {
    from,
    to,
    fromIso: toPunchRangeIso(from, false),
    toIso: toPunchRangeIso(to, true),
  }
}

type PunchDateRangeFilterProps = {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined, iso: PunchDateRangeValue) => void
  label?: string
  /** Used when preset is `lastDays` (default). */
  defaultDays?: number
  /** `currentMonthToToday`: default 1st of month → today (calendar stays free to pick other months). */
  preset?: PunchDateRangePreset
}

export function PunchDateRangeFilter({
  value,
  onChange,
  label = "Date range",
  defaultDays = 7,
  preset = "lastDays",
}: PunchDateRangeFilterProps) {
  const defaultToCurrentMonth = preset === "currentMonthToToday"

  React.useEffect(() => {
    if (!value?.from) {
      const range =
        defaultToCurrentMonth
          ? getCurrentMonthToTodayRange()
          : { from: subDays(new Date(), defaultDays), to: new Date() }
      onChange(range, punchRangeToIso(range))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase text-muted-foreground">{label}</Label>
      <DateRangePicker
        date={value}
        setDate={(range) => onChange(range, punchRangeToIso(range))}
        defaultMonth={value?.from}
        numberOfMonths={2}
      />
      {value?.from && (
        <p className="text-[10px] text-muted-foreground font-mono">
          {format(value.from, "dd MMM yyyy")}
          {value.to ? ` → ${format(value.to, "dd MMM yyyy")}` : ""}
        </p>
      )}
    </div>
  )
}
