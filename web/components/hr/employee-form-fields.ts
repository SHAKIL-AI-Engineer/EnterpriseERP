import { cn } from "@/lib/utils"

/** Medium control sizing for Add/Edit employee form fields. */
export const employeeFormFieldsClass =
  "[&_[data-slot=input]]:h-10 [&_[data-slot=input]]:px-3 [&_[data-slot=input]]:text-sm [&_[data-slot=textarea]]:px-3 [&_[data-slot=textarea]]:py-2 [&_[data-slot=textarea]]:text-sm [&_[data-slot=native-select]]:h-10 [&_[data-slot=native-select]]:px-3 [&_[data-slot=native-select]]:text-sm [&_[data-slot=button]]:h-10 [&_[data-slot=button]]:px-3.5 [&_[data-slot=button]]:text-sm [&_label]:text-sm"

export function employeeFormFieldsCn(...classes: (string | undefined)[]) {
  return cn(employeeFormFieldsClass, ...classes)
}

export const employeeFormActionButtonClass = "h-10 px-5 text-sm"
