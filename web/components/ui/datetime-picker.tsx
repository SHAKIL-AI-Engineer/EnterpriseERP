"use client"

import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { parsePunchTimeToDate } from "@/lib/format-attendance-time"

const DATETIME_DISPLAY_FORMAT = "dd/MM/yyyy hh:mm aa"
const DATETIME_24H_FORMAT = "dd/MM/yyyy HH:mm"
const DATE_INPUT_PATTERN = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/
const TIME_ONLY = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/

interface DateTimePickerProps {
    date?: Date
    setDate: (date?: Date) => void
    placeholder?: string
    className?: string
    variant?: "button" | "input"
    attendanceDate?: string
    fromYear?: number
    toYear?: number
}

function formatDateTimeValue(value: Date) {
    return format(value, DATETIME_DISPLAY_FORMAT)
}

function parseDateTimeInput(value: string, attendanceDate?: string): Date | undefined {
    const trimmed = value.trim()
    if (!trimmed) return undefined

    if (attendanceDate && TIME_ONLY.test(trimmed)) {
        return parsePunchTimeToDate(trimmed, attendanceDate)
    }

    const parsed12 = parse(trimmed, DATETIME_DISPLAY_FORMAT, new Date())
    if (isValid(parsed12)) return parsed12

    const parsed24 = parse(trimmed, DATETIME_24H_FORMAT, new Date())
    if (isValid(parsed24)) return parsed24

    const dateTimeMatch = trimmed.match(
        /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i,
    )
    if (dateTimeMatch) {
        const day = Number(dateTimeMatch[1])
        const month = Number(dateTimeMatch[2])
        const year = Number(dateTimeMatch[3])
        let hours = Number(dateTimeMatch[4])
        const minutes = Number(dateTimeMatch[5])
        const ampm = dateTimeMatch[6]?.toUpperCase()
        if (ampm === "PM" && hours < 12) hours += 12
        if (ampm === "AM" && hours === 12) hours = 0
        const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0)
        if (
            parsed.getFullYear() === year &&
            parsed.getMonth() === month - 1 &&
            parsed.getDate() === day
        ) {
            return parsed
        }
    }

    const dateOnlyMatch = trimmed.match(DATE_INPUT_PATTERN)
    if (dateOnlyMatch) {
        const day = Number(dateOnlyMatch[1])
        const month = Number(dateOnlyMatch[2])
        const year = Number(dateOnlyMatch[3])
        const parsed = new Date(year, month - 1, day, 0, 0, 0, 0)
        if (
            parsed.getFullYear() === year &&
            parsed.getMonth() === month - 1 &&
            parsed.getDate() === day
        ) {
            return parsed
        }
    }

    const iso = parsePunchTimeToDate(trimmed, attendanceDate)
    if (iso) return iso

    const direct = new Date(trimmed)
    if (!Number.isNaN(direct.getTime())) return direct

    return undefined
}

function isWithinYearRange(date: Date, fromYear: number, toYear: number) {
    const year = date.getFullYear()
    return year >= fromYear && year <= toYear
}

function DateTimePickerPopover({
    selectedDate,
    setSelectedDate,
    onDateChange,
    month,
    onMonthChange,
    fromYear,
    toYear,
}: {
    selectedDate?: Date
    setSelectedDate: (date?: Date) => void
    onDateChange: (date: Date) => void
    month: Date
    onMonthChange: (month: Date) => void
    fromYear: number
    toYear: number
}) {
    const handleDateSelect = (newDate: Date | undefined) => {
        if (!newDate) return

        const current = selectedDate || new Date()
        const updated = new Date(newDate)
        updated.setHours(current.getHours())
        updated.setMinutes(current.getMinutes())
        updated.setSeconds(0, 0)

        setSelectedDate(updated)
        onDateChange(updated)
        onMonthChange(updated)
    }

    const handleTimeSelect = (type: "hours" | "minutes", value: number) => {
        const current = selectedDate || new Date()
        const updated = new Date(current)

        if (type === "hours") updated.setHours(value)
        else updated.setMinutes(value)

        updated.setSeconds(0, 0)
        setSelectedDate(updated)
        onDateChange(updated)
    }

    return (
        <div className="flex divide-x shadow-2xl">
            <Calendar
                mode="single"
                selected={selectedDate}
                month={month}
                onMonthChange={onMonthChange}
                onSelect={handleDateSelect}
                initialFocus
                startMonth={new Date(fromYear, 0)}
                endMonth={new Date(toYear, 11)}
            />
            <div className="flex bg-muted/5">
                <div className="flex flex-col h-[300px]">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-3 border-b text-center bg-muted/20">
                        Hrs
                    </div>
                    <div
                        className="flex-1 overflow-y-auto w-20 p-1 space-y-1"
                        onWheel={(e) => e.stopPropagation()}
                    >
                        {Array.from({ length: 24 }).map((_, i) => (
                            <Button
                                key={i}
                                type="button"
                                variant={selectedDate?.getHours() === i ? "default" : "ghost"}
                                size="sm"
                                className={cn(
                                    "w-full text-xs h-8 rounded-md font-medium transition-all",
                                    selectedDate?.getHours() === i
                                        ? "shadow-md scale-105"
                                        : "hover:bg-primary/5",
                                )}
                                onClick={() => handleTimeSelect("hours", i)}
                            >
                                {i.toString().padStart(2, "0")}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col h-[300px] border-l divide-x">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-3 border-b text-center bg-muted/20">
                        Min
                    </div>
                    <div
                        className="flex-1 overflow-y-auto w-20 p-1 space-y-1"
                        onWheel={(e) => e.stopPropagation()}
                    >
                        {Array.from({ length: 60 }).map((_, i) => (
                            <Button
                                key={i}
                                type="button"
                                variant={selectedDate?.getMinutes() === i ? "default" : "ghost"}
                                size="sm"
                                className={cn(
                                    "w-full text-xs h-8 rounded-md font-medium transition-all",
                                    selectedDate?.getMinutes() === i
                                        ? "shadow-md scale-105"
                                        : "hover:bg-primary/5",
                                )}
                                onClick={() => handleTimeSelect("minutes", i)}
                            >
                                {i.toString().padStart(2, "0")}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function DateTimePickerButtonVariant({
    date,
    setDate,
    placeholder,
    className,
    attendanceDate,
    fromYear,
    toYear,
}: Omit<DateTimePickerProps, "variant"> & { fromYear: number; toYear: number }) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
    const [calendarMonth, setCalendarMonth] = React.useState<Date>(() => date ?? new Date())

    React.useEffect(() => {
        setSelectedDate(date)
        if (date) setCalendarMonth(date)
    }, [date])

    const handleDateChange = (updated: Date) => {
        setDate(updated)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !date && "text-muted-foreground",
                        className,
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? formatDateTimeValue(date) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <DateTimePickerPopover
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    onDateChange={handleDateChange}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    fromYear={fromYear}
                    toYear={toYear}
                />
            </PopoverContent>
        </Popover>
    )
}

function DateTimePickerInputVariant({
    date,
    setDate,
    placeholder = "dd/mm/yyyy hh:mm am",
    className,
    attendanceDate,
    fromYear,
    toYear,
}: Omit<DateTimePickerProps, "variant"> & { fromYear: number; toYear: number }) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    const [invalid, setInvalid] = React.useState(false)
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
    const [calendarMonth, setCalendarMonth] = React.useState<Date>(() => date ?? new Date())

    React.useEffect(() => {
        setInputValue(date ? formatDateTimeValue(date) : "")
        setInvalid(false)
        setSelectedDate(date)
        if (date) setCalendarMonth(date)
    }, [date])

    const commitInput = React.useCallback(
        (rawValue: string) => {
            const trimmed = rawValue.trim()
            if (!trimmed) {
                setInvalid(false)
                setInputValue("")
                setSelectedDate(undefined)
                setDate(undefined)
                return true
            }

            const parsed = parseDateTimeInput(trimmed, attendanceDate)
            if (!parsed || !isWithinYearRange(parsed, fromYear, toYear)) {
                setInvalid(true)
                return false
            }

            setInvalid(false)
            setInputValue(formatDateTimeValue(parsed))
            setSelectedDate(parsed)
            setDate(parsed)
            setCalendarMonth(parsed)
            return true
        },
        [attendanceDate, fromYear, setDate, toYear],
    )

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value)
        setInvalid(false)
    }

    const handleInputBlur = () => {
        if (!inputValue.trim()) {
            setInvalid(false)
            setDate(undefined)
            setSelectedDate(undefined)
            return
        }

        if (!commitInput(inputValue)) {
            setInputValue(date ? formatDateTimeValue(date) : "")
        }
    }

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault()
            if (!commitInput(inputValue)) {
                setInputValue(date ? formatDateTimeValue(date) : "")
            }
        }
    }

    const handlePopoverDateChange = (updated: Date) => {
        setInputValue(formatDateTimeValue(updated))
        setInvalid(false)
        setDate(updated)
    }

    return (
        <div className={cn("flex w-full", className)}>
            <Input
                type="text"
                autoComplete="off"
                placeholder={placeholder}
                value={inputValue}
                aria-invalid={invalid}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                className="rounded-r-none border-r-0 focus-visible:z-10 h-10"
            />
            <Popover
                open={open}
                onOpenChange={(nextOpen) => {
                    if (nextOpen) {
                        setCalendarMonth(selectedDate ?? date ?? new Date())
                    }
                    setOpen(nextOpen)
                }}
            >
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        aria-label="Open date and time picker"
                        className="shrink-0 rounded-l-none px-3 h-10"
                    >
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <DateTimePickerPopover
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        onDateChange={handlePopoverDateChange}
                        month={calendarMonth}
                        onMonthChange={setCalendarMonth}
                        fromYear={fromYear}
                        toYear={toYear}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}

export function DateTimePicker({
    date,
    setDate,
    placeholder = "dd/mm/yyyy hh:mm am",
    className,
    variant = "input",
    attendanceDate,
    fromYear = 1940,
    toYear = new Date().getFullYear() + 5,
}: DateTimePickerProps) {
    if (variant === "button") {
        return (
            <DateTimePickerButtonVariant
                date={date}
                setDate={setDate}
                placeholder={placeholder}
                className={className}
                attendanceDate={attendanceDate}
                fromYear={fromYear}
                toYear={toYear}
            />
        )
    }

    return (
        <DateTimePickerInputVariant
            date={date}
            setDate={setDate}
            placeholder={placeholder}
            className={className}
            attendanceDate={attendanceDate}
            fromYear={fromYear}
            toYear={toYear}
        />
    )
}
