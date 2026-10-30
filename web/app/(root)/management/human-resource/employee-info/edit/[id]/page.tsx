"use client"

import * as React from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { IconArrowLeft, IconLoader, IconUserCircle } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { getHttpErrorMessage } from "@/lib/api-response"
import { toast } from "sonner"
import { EmployeeHrForm } from "@/components/hr/employee-hr-form"
import {
  employeeService,
  type Employee,
  type UpdateEmployeeDto,
} from "@/lib/services/employee"
import { companyService, type Company } from "@/lib/services/company"

export default function EditEmployeePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const employeeIdParam = params?.id as string
  const companyIdInt = parseInt(searchParams.get("companyId") ?? "0", 10)

  const [companies, setCompanies] = React.useState<Company[]>([])
  const [employee, setEmployee] = React.useState<Employee | null>(null)
  const [isFetching, setIsFetching] = React.useState(true)

  React.useEffect(() => {
    companyService.getAll().then(setCompanies)
  }, [])

  React.useEffect(() => {
    if (!employeeIdParam || !companyIdInt) return
    setIsFetching(true)
    employeeService
      .getEmployee(employeeIdParam, companyIdInt)
      .then(setEmployee)
      .catch(() => {
        toast.error("Failed to load employee")
        router.push("/management/human-resource/employee-info")
      })
      .finally(() => setIsFetching(false))
  }, [employeeIdParam, companyIdInt, router])

  if (isFetching || !employee) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <IconLoader className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <IconArrowLeft className="size-5" />
        </Button>
        <IconUserCircle className="size-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit employee</h1>
          <p className="text-sm text-muted-foreground">
            {employee.fullNameEn} ({employee.employeeId}) — fill each section using the tabs below.
          </p>
        </div>
      </div>

      <EmployeeHrForm
        mode="edit"
        companies={companies}
        employeeEntityId={employee.entityId}
        documents={employee.documents ?? []}
        onDocumentsChanged={() =>
          employeeService.getEmployee(employeeIdParam, companyIdInt).then(setEmployee)
        }
        onCancel={() => router.back()}
        initial={{
          companyId: employee.companyId,
          punchNumber: employee.punchNumber,
          employeeId: employee.employeeId,
          fullNameEn: employee.fullNameEn,
          fullNameBn: employee.fullNameBn,
          nid: employee.nid,
          gender: employee.gender,
          religion: employee.religion,
          bloodGroup: employee.bloodGroup,
          fatherNameEn: employee.fatherNameEn,
          fatherNameBn: employee.fatherNameBn,
          motherNameEn: employee.motherNameEn,
          motherNameBn: employee.motherNameBn,
          maritalStatus: employee.maritalStatus,
          spouseNameEn: employee.spouseNameEn,
          spouseNameBn: employee.spouseNameBn,
          spouseOccupation: employee.spouseOccupation,
          spouseContact: employee.spouseContact,
          educationLevel: employee.educationLevel,
          institution: employee.institution,
          fieldOfStudy: employee.fieldOfStudy,
          skills: employee.skills,
          reference1Name: employee.reference1Name,
          reference1Relation: employee.reference1Relation,
          reference1Phone: employee.reference1Phone,
          reference1Address: employee.reference1Address,
          reference2Name: employee.reference2Name,
          reference2Relation: employee.reference2Relation,
          reference2Phone: employee.reference2Phone,
          reference2Address: employee.reference2Address,
          dateOfBirth: employee.dateOfBirth,
          departmentId: employee.departmentId,
          sectionId: employee.sectionId,
          designationId: employee.designationId,
          lineId: employee.lineId,
          lineName: employee.lineName,
          groupId: employee.groupId,
          shiftId: employee.shiftId,
          shiftName: employee.shiftName,
          status: employee.status,
          joinDate: employee.joinDate,
          email: employee.email,
          phoneNumber: employee.phoneNumber,
          grossSalary: employee.grossSalary,
          basicSalary: employee.basicSalary,
          houseRent: employee.houseRent,
          medicalAllowance: employee.medicalAllowance,
          conveyance: employee.conveyance,
          foodAllowance: employee.foodAllowance,
          presentAddress: employee.presentAddress,
          presentPostalCode: employee.presentPostalCode,
          presentDivisionName: employee.presentDivisionName,
          presentDistrictName: employee.presentDistrictName,
          presentUpazilaName: employee.presentUpazilaName,
          presentPostOfficeName: employee.presentPostOfficeName,
          permanentAddress: employee.permanentAddress,
          permanentPostalCode: employee.permanentPostalCode,
          permanentDivisionName: employee.permanentDivisionName,
          permanentDistrictName: employee.permanentDistrictName,
          permanentUpazilaName: employee.permanentUpazilaName,
          permanentPostOfficeName: employee.permanentPostOfficeName,
          bankName: employee.bankName,
          bankBranchName: employee.bankBranchName,
          bankAccountNo: employee.bankAccountNo,
          bankAccountType: employee.bankAccountType,
          profileImageUrl: employee.profileImageUrl,
          signatureImageUrl: employee.signatureImageUrl,
          emergencyContactName: employee.emergencyContactName,
          emergencyContactRelation: employee.emergencyContactRelation,
          emergencyContactPhone: employee.emergencyContactPhone,
          emergencyContactAddress: employee.emergencyContactAddress,
          isActive: employee.isActive,
          isOtEnabled: employee.isOtEnabled,
        }}
        onSubmit={async (data) => {
          try {
            await employeeService.updateEmployee(
              employeeIdParam,
              data as UpdateEmployeeDto,
              companyIdInt,
            )
            toast.success("Employee updated")
            router.push(
              `/management/human-resource/employee-info/${employee.employeeId}?companyId=${companyIdInt}`,
            )
          } catch (e: unknown) {
            toast.error(getHttpErrorMessage(e, "Failed to update employee"))
            throw e
          }
        }}
      />
    </div>
  )
}
