"use client"

import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

const DATE_DISPLAY_FORMAT = "dd/MM/yyyy"
const DATE_INPUT_PATTERN = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/

interface DatePickerProps {
    date?: Date
    setDate: (date?: Date) => void
    placeholder?: string
    className?: string
    size?: "default" | "medium"
    variant?: "button" | "input"
    fromYear?: number
    toYear?: number
    captionLayout?: "label" | "dropdown"
}

const triggerSizeClasses = {
    default: "",
    medium: "h-10 px-3 text-sm",
} as const

const calendarSizeClasses = {
    default: "",
    medium: "[--cell-size:--spacing(8)] p-3",
} as const

const inputSizeClasses = {
    default: "",
    medium: "h-10 px-3 text-sm",
} as const

function formatDateValue(date: Date) {
    return format(date, DATE_DISPLAY_FORMAT)
}

function formatDateInputWhileTyping(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 8)
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function parseDateInput(value: string): Date | undefined {
    const trimmed = value.trim()
    if (!trimmed) return undefined

    const match = trimmed.match(DATE_INPUT_PATTERN)
    if (match) {
        const day = Number(match[1])
        const month = Number(match[2])
        const year = Number(match[3])
        const parsed = new Date(year, month - 1, day)
        if (
            parsed.getFullYear() === year &&
            parsed.getMonth() === month - 1 &&
            parsed.getDate() === day
        ) {
            return parsed
        }
        return undefined
    }

    const parsed = parse(trimmed, DATE_DISPLAY_FORMAT, new Date())
    return isValid(parsed) ? parsed : undefined
}

function isWithinYearRange(date: Date, fromYear: number, toYear: number) {
    const year = date.getFullYear()
    return year >= fromYear && year <= toYear
}

function resolveCalendarMonth(date?: Date, inputValue?: string) {
    const typed = inputValue ? parseDateInput(inputValue) : undefined
    return typed ?? date ?? new Date()
}

function DatePickerCalendar({
    date,
    setDate,
    month,
    onMonthChange,
    size,
    fromYear,
    toYear,
    captionLayout,
    onSelect,
}: {
    date?: Date
    setDate: (date?: Date) => void
    month: Date
    onMonthChange: (month: Date) => void
    size: "default" | "medium"
    fromYear: number
    toYear: number
    captionLayout: "label" | "dropdown"
    onSelect?: (date?: Date) => void
}) {
    return (
        <Calendar
            mode="single"
            selected={date}
            month={month}
            onMonthChange={onMonthChange}
            onSelect={(nextDate) => {
                setDate(nextDate)
                if (nextDate) onMonthChange(nextDate)
                onSelect?.(nextDate)
            }}
            initialFocus
            captionLayout={captionLayout}
            startMonth={new Date(fromYear, 0)}
            endMonth={new Date(toYear, 11)}
            className={calendarSizeClasses[size]}
        />
    )
}

function DatePickerButtonVariant({
    date,
    setDate,
    placeholder,
    className,
    size,
    fromYear,
    toYear,
    captionLayout,
}: Omit<DatePickerProps, "variant"> & {
    size: "default" | "medium"
    fromYear: number
    toYear: number
    captionLayout: "label" | "dropdown"
}) {
    const [calendarMonth, setCalendarMonth] = React.useState<Date>(() => resolveCalendarMonth(date))

    React.useEffect(() => {
        if (date) setCalendarMonth(date)
    }, [date])

    return (
        <Popover
            onOpenChange={(nextOpen) => {
                if (nextOpen) setCalendarMonth(resolveCalendarMonth(date))
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        triggerSizeClasses[size],
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? formatDateValue(date) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <DatePickerCalendar
                    date={date}
                    setDate={setDate}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    size={size}
                    fromYear={fromYear}
                    toYear={toYear}
                    captionLayout={captionLayout}
                />
            </PopoverContent>
        </Popover>
    )
}

function DatePickerInputVariant({
    date,
    setDate,
    placeholder = "dd/mm/yyyy",
    className,
    size,
    fromYear,
    toYear,
    captionLayout,
}: Omit<DatePickerProps, "variant"> & {
    size: "default" | "medium"
    fromYear: number
    toYear: number
    captionLayout: "label" | "dropdown"
}) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    const [invalid, setInvalid] = React.useState(false)
    const [calendarMonth, setCalendarMonth] = React.useState<Date>(() => resolveCalendarMonth(date))

    React.useEffect(() => {
        setInputValue(date ? formatDateValue(date) : "")
        setInvalid(false)
        if (date) setCalendarMonth(date)
    }, [date])

    const commitInput = React.useCallback(
        (rawValue: string) => {
            const trimmed = rawValue.trim()
            if (!trimmed) {
                setInvalid(false)
                setInputValue("")
                setDate(undefined)
                return true
            }

            const parsed = parseDateInput(trimmed)
            if (!parsed || !isWithinYearRange(parsed, fromYear, toYear)) {
                setInvalid(true)
                return false
            }

            setInvalid(false)
            setInputValue(formatDateValue(parsed))
            setDate(parsed)
            setCalendarMonth(parsed)
            return true
        },
        [fromYear, setDate, toYear]
    )

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = formatDateInputWhileTyping(event.target.value)
        setInputValue(nextValue)
        setInvalid(false)

        if (nextValue.length === 10) {
            commitInput(nextValue)
        } else {
            const partial = parseDateInput(nextValue)
            if (partial) setCalendarMonth(partial)
        }
    }

    const handleInputBlur = () => {
        if (!inputValue.trim()) {
            setInvalid(false)
            setDate(undefined)
            return
        }

        if (!commitInput(inputValue)) {
            setInputValue(date ? formatDateValue(date) : "")
        }
    }

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault()
            if (!commitInput(inputValue)) {
                setInputValue(date ? formatDateValue(date) : "")
            }
        }
    }

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setCalendarMonth(resolveCalendarMonth(date, inputValue))
        }
        setOpen(nextOpen)
    }

    return (
        <div className={cn("flex w-full", className)}>
            <Input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={placeholder}
                value={inputValue}
                aria-invalid={invalid}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                className={cn(
                    "rounded-r-none border-r-0 focus-visible:z-10",
                    inputSizeClasses[size]
                )}
            />
            <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        aria-label="Open calendar"
                        className={cn(
                            "shrink-0 rounded-l-none px-3",
                            triggerSizeClasses[size]
                        )}
                    >
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <DatePickerCalendar
                        date={date}
                        setDate={setDate}
                        month={calendarMonth}
                        onMonthChange={setCalendarMonth}
                        size={size}
                        fromYear={fromYear}
                        toYear={toYear}
                        captionLayout={captionLayout}
                        onSelect={() => setOpen(false)}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}

export function DatePicker({
    date,
    setDate,
    placeholder = "Pick a date",
    className,
    size = "default",
    variant = "button",
    fromYear = 1940,
    toYear = new Date().getFullYear(),
    captionLayout = "label",
}: DatePickerProps) {
    if (variant === "input") {
        return (
            <DatePickerInputVariant
                date={date}
                setDate={setDate}
                placeholder={placeholder}
                className={className}
                size={size}
                fromYear={fromYear}
                toYear={toYear}
                captionLayout={captionLayout}
            />
        )
    }

    return (
        <DatePickerButtonVariant
            date={date}
            setDate={setDate}
            placeholder={placeholder}
            className={className}
            size={size}
            fromYear={fromYear}
            toYear={toYear}
            captionLayout={captionLayout}
        />
    )
}
