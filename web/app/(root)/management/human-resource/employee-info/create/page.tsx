"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconArrowLeft, IconUserCircle } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { EmployeeHrForm } from "@/components/hr/employee-hr-form"
import { getHttpErrorMessage } from "@/lib/api-response"
import { employeeService, type CreateEmployeeDto } from "@/lib/services/employee"
import { companyService, type Company } from "@/lib/services/company"

export default function CreateEmployeePage() {
  const router = useRouter()
  const [companies, setCompanies] = React.useState<Company[]>([])

  React.useEffect(() => {
    companyService.getAll().then(setCompanies).catch(() => {
      toast.error("Failed to load companies")
    })
  }, [])

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <IconArrowLeft className="size-5" />
        </Button>
        <IconUserCircle className="size-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add employee</h1>
          <p className="text-sm text-muted-foreground">
            Fill each section using the tabs below.
          </p>
        </div>
      </div>

      <EmployeeHrForm
        mode="create"
        companies={companies}
        onCancel={() => router.back()}
        onSubmit={async (data) => {
          try {
            await employeeService.createEmployee(data as CreateEmployeeDto)
            toast.success("Employee created")
            router.push("/management/human-resource/employee-info")
          } catch (e: unknown) {
            let msg = getHttpErrorMessage(e, "Failed to create employee")
            if (/punchnumber.*already exists/i.test(msg)) {
              msg = `${msg} Use a different punch number or edit the existing employee.`
            }
            toast.error(msg)
            throw e
          }
        }}
      />
    </div>
  )
}
