"use client"

import * as React from "react"
import { format, startOfMonth } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange, Matcher } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
    date?: DateRange
    setDate: (date?: DateRange) => void
    placeholder?: string
    className?: string
    fromYear?: number
    toYear?: number
    defaultMonth?: Date
    numberOfMonths?: number
    disabled?: Matcher | Matcher[]
    fromDate?: Date
    toDate?: Date
}

export function DateRangePicker({
    date,
    setDate,
    placeholder = "Pick a date range",
    className,
    fromYear = 1960,
    toYear = 2030,
    defaultMonth,
    numberOfMonths = 2,
    disabled,
    fromDate,
    toDate,
}: DateRangePickerProps) {
    const [month, setMonth] = React.useState<Date | undefined>(defaultMonth ?? date?.from)

    React.useEffect(() => {
        if (date?.from) setMonth(startOfMonth(date.from))
    }, [date?.from])

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal h-10 rounded-xl dark:bg-input/30 dark:hover:bg-input/50",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={defaultMonth ?? date?.from}
                        month={month}
                        onMonthChange={setMonth}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={numberOfMonths}
                        disabled={disabled}
                        startMonth={fromDate}
                        endMonth={toDate}
                        fromYear={fromYear}
                        toYear={toYear}
                        captionLayout="dropdown"
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
