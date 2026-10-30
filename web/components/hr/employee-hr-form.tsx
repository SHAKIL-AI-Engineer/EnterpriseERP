"use client"

import * as React from "react"
import {
  IconArrowLeft,
  IconArrowRight,
  IconBriefcase,
  IconBuildingBank,
  IconCheck,
  IconCurrencyTaka,
  IconFile,
  IconLoader,
  IconMapPin,
  IconPhoneCall,
  IconPhoto,
  IconSchool,
  IconUser,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  EmployeeAddressSection,
  addressValueToPayload,
  emptyEmployeeAddress,
  type EmployeeAddressFormValue,
} from "@/components/hr/employee-address-section"
import { EmployeeDocumentsPanel } from "@/components/hr/employee-documents-panel"
import { EmployeeImageField } from "@/components/hr/employee-image-field"
import {
  employeeFormActionButtonClass,
  employeeFormFieldsCn,
} from "@/components/hr/employee-form-fields"
import { BANGLADESH_BANKS, getBankBranches } from "@/lib/constants/bangladesh-banks"
import {
  EMPLOYEE_BLOOD_GROUPS,
  EMPLOYEE_EDUCATION_LEVELS,
  EMPLOYEE_MARITAL_STATUSES,
  EMPLOYEE_RELIGIONS,
} from "@/lib/constants/employee-profile-options"
import type { Company } from "@/lib/services/company"
import type { CreateEmployeeDto, UpdateEmployeeDto } from "@/lib/services/employee"
import { isValidHrEmployeeId, normalizeHrEmployeeId } from "@/lib/services/employee"
import type { HrEmployeeDocument } from "@/lib/services/hr-types"
import { organogramService } from "@/lib/services/organogram"
import { calculateSalaryFromGross } from "@/lib/payroll/salary-from-gross"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export type EmployeeHrFormValues = CreateEmployeeDto & {
  isActive?: boolean
  isOtEnabled?: boolean
  presentDivisionName?: string
  presentDistrictName?: string
  presentUpazilaName?: string
  presentPostOfficeName?: string
  permanentDivisionName?: string
  permanentDistrictName?: string
  permanentUpazilaName?: string
  permanentPostOfficeName?: string
  groupName?: string
  shiftName?: string
}

const BASE_TABS = [
  { value: "personal", label: "Personal", icon: IconUser },
  { value: "family", label: "Family", icon: IconUsers },
  { value: "employment", label: "Employment", icon: IconBriefcase },
  { value: "salary", label: "Salary", icon: IconCurrencyTaka },
  { value: "address", label: "Address", icon: IconMapPin },
  { value: "bank", label: "Bank", icon: IconBuildingBank },
  { value: "emergency", label: "Emergency", icon: IconPhoneCall },
  { value: "education", label: "Education & Skills", icon: IconSchool },
  { value: "references", label: "References", icon: IconUsersGroup },
  { value: "photos", label: "Profile & Signature", icon: IconPhoto },
] as const

const DOCUMENTS_TAB = {
  value: "documents",
  label: "Documents",
  icon: IconFile,
} as const

type TabValue =
  | (typeof BASE_TABS)[number]["value"]
  | typeof DOCUMENTS_TAB.value

type EmployeeHrFormProps = {
  mode: "create" | "edit"
  companies: Company[]
  initial?: Partial<EmployeeHrFormValues>
  submitLabel?: string
  employeeEntityId?: string
  documents?: HrEmployeeDocument[]
  onDocumentsChanged?: () => void
  onCancel?: () => void
  onSubmit: (data: CreateEmployeeDto | UpdateEmployeeDto) => Promise<void>
}

function initialGross(initial?: Partial<EmployeeHrFormValues>): string {
  if (initial?.grossSalary != null && initial.grossSalary > 0) {
    return String(initial.grossSalary)
  }
  const sum =
    (initial?.basicSalary ?? 0) +
    (initial?.houseRent ?? 0) +
    (initial?.medicalAllowance ?? 0) +
    (initial?.conveyance ?? 0) +
    (initial?.foodAllowance ?? 0)
  return sum > 0 ? String(sum) : ""
}

export function EmployeeHrForm({
  mode,
  companies,
  initial,
  submitLabel,
  employeeEntityId,
  documents = [],
  onDocumentsChanged,
  onCancel,
  onSubmit,
}: EmployeeHrFormProps) {
  const [activeTab, setActiveTab] = React.useState<TabValue>("personal")
  const [isLoading, setIsLoading] = React.useState(false)
  const [joinDate, setJoinDate] = React.useState<Date | undefined>(
    initial?.joinDate ? new Date(initial.joinDate) : new Date(),
  )
  const [dob, setDob] = React.useState<Date | undefined>(
    initial?.dateOfBirth ? new Date(initial.dateOfBirth) : undefined,
  )

  const [selectedCompanyId, setSelectedCompanyId] = React.useState(
    initial?.companyId ?? 0,
  )
  const [punchNumber, setPunchNumber] = React.useState(
    initial?.punchNumber ? String(initial.punchNumber) : "",
  )
  const [employeeId, setEmployeeId] = React.useState(initial?.employeeId ?? "")
  const [fullNameEn, setFullNameEn] = React.useState(initial?.fullNameEn ?? "")
  const [fullNameBn, setFullNameBn] = React.useState(initial?.fullNameBn ?? "")
  const [nid, setNid] = React.useState(initial?.nid ?? "")
  const [gender, setGender] = React.useState(initial?.gender ?? "")
  const [religion, setReligion] = React.useState(initial?.religion ?? "")
  const [bloodGroup, setBloodGroup] = React.useState(initial?.bloodGroup ?? "")
  const [fatherNameEn, setFatherNameEn] = React.useState(initial?.fatherNameEn ?? "")
  const [fatherNameBn, setFatherNameBn] = React.useState(initial?.fatherNameBn ?? "")
  const [motherNameEn, setMotherNameEn] = React.useState(initial?.motherNameEn ?? "")
  const [motherNameBn, setMotherNameBn] = React.useState(initial?.motherNameBn ?? "")
  const [maritalStatus, setMaritalStatus] = React.useState(initial?.maritalStatus ?? "")
  const [spouseNameEn, setSpouseNameEn] = React.useState(initial?.spouseNameEn ?? "")
  const [spouseNameBn, setSpouseNameBn] = React.useState(initial?.spouseNameBn ?? "")
  const [spouseOccupation, setSpouseOccupation] = React.useState(initial?.spouseOccupation ?? "")
  const [spouseContact, setSpouseContact] = React.useState(initial?.spouseContact ?? "")
  const [educationLevel, setEducationLevel] = React.useState(initial?.educationLevel ?? "")
  const [institution, setInstitution] = React.useState(initial?.institution ?? "")
  const [fieldOfStudy, setFieldOfStudy] = React.useState(initial?.fieldOfStudy ?? "")
  const [skills, setSkills] = React.useState(initial?.skills ?? "")
  const [reference1Name, setReference1Name] = React.useState(initial?.reference1Name ?? "")
  const [reference1Relation, setReference1Relation] = React.useState(initial?.reference1Relation ?? "")
  const [reference1Phone, setReference1Phone] = React.useState(initial?.reference1Phone ?? "")
  const [reference1Address, setReference1Address] = React.useState(initial?.reference1Address ?? "")
  const [reference2Name, setReference2Name] = React.useState(initial?.reference2Name ?? "")
  const [reference2Relation, setReference2Relation] = React.useState(initial?.reference2Relation ?? "")
  const [reference2Phone, setReference2Phone] = React.useState(initial?.reference2Phone ?? "")
  const [reference2Address, setReference2Address] = React.useState(initial?.reference2Address ?? "")
  const [email, setEmail] = React.useState(initial?.email ?? "")
  const [phone, setPhone] = React.useState(initial?.phoneNumber ?? "")
  const [status, setStatus] = React.useState(initial?.status ?? "Active")
  const [departmentId, setDepartmentId] = React.useState(initial?.departmentId ?? 0)
  const [sectionId, setSectionId] = React.useState(initial?.sectionId ?? 0)
  const [designationId, setDesignationId] = React.useState(initial?.designationId ?? 0)
  const [lineId, setLineId] = React.useState(initial?.lineId ?? 0)
  const [groupId, setGroupId] = React.useState(initial?.groupId ?? 0)
  const [shiftId, setShiftId] = React.useState(initial?.shiftId ?? 0)
  const [isActive, setIsActive] = React.useState(initial?.isActive ?? true)
  const [isOtEnabled, setIsOtEnabled] = React.useState(initial?.isOtEnabled ?? true)

  const [grossSalaryInput, setGrossSalaryInput] = React.useState(initialGross(initial))
  const [basicSalary, setBasicSalary] = React.useState(String(initial?.basicSalary ?? 0))
  const [houseRent, setHouseRent] = React.useState(String(initial?.houseRent ?? 0))
  const [medicalAllowance, setMedicalAllowance] = React.useState(
    String(initial?.medicalAllowance ?? 0),
  )
  const [conveyance, setConveyance] = React.useState(String(initial?.conveyance ?? 0))
  const [foodAllowance, setFoodAllowance] = React.useState(
    String(initial?.foodAllowance ?? 0),
  )

  const [presentAddress, setPresentAddress] = React.useState<EmployeeAddressFormValue>(
    emptyEmployeeAddress({
      addressLine: initial?.presentAddress ?? "",
      postalCode: initial?.presentPostalCode ?? "",
      divisionName: initial?.presentDivisionName ?? initial?.presentDivision,
      districtName: initial?.presentDistrictName ?? initial?.presentDistrict,
      upazilaName: initial?.presentUpazilaName ?? initial?.presentUpazila,
      postOfficeName: initial?.presentPostOfficeName ?? initial?.presentPostOffice,
    }),
  )
  const [permanentAddress, setPermanentAddress] = React.useState<EmployeeAddressFormValue>(
    emptyEmployeeAddress({
      addressLine: initial?.permanentAddress ?? "",
      postalCode: initial?.permanentPostalCode ?? "",
      divisionName: initial?.permanentDivisionName ?? initial?.permanentDivision,
      districtName: initial?.permanentDistrictName ?? initial?.permanentDistrict,
      upazilaName: initial?.permanentUpazilaName ?? initial?.permanentUpazila,
      postOfficeName: initial?.permanentPostOfficeName ?? initial?.permanentPostOffice,
    }),
  )

  const [bankName, setBankName] = React.useState(initial?.bankName ?? "")
  const [bankBranchName, setBankBranchName] = React.useState(initial?.bankBranchName ?? "")
  const [bankAccountNo, setBankAccountNo] = React.useState(initial?.bankAccountNo ?? "")
  const [bankAccountType, setBankAccountType] = React.useState(
    initial?.bankAccountType === "mCash Account" ? "mCash Account" : "Bank Account",
  )

  const [profileImageUrl, setProfileImageUrl] = React.useState(initial?.profileImageUrl ?? "")
  const [signatureImageUrl, setSignatureImageUrl] = React.useState(initial?.signatureImageUrl ?? "")

  const [emergencyContactName, setEmergencyContactName] = React.useState(
    initial?.emergencyContactName ?? "",
  )
  const [emergencyContactRelation, setEmergencyContactRelation] = React.useState(
    initial?.emergencyContactRelation ?? "",
  )
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState(
    initial?.emergencyContactPhone ?? "",
  )
  const [emergencyContactAddress, setEmergencyContactAddress] = React.useState(
    initial?.emergencyContactAddress ?? "",
  )

  const [departments, setDepartments] = React.useState<
    Awaited<ReturnType<typeof organogramService.getDepartments>>
  >([])
  const [sections, setSections] = React.useState<
    Awaited<ReturnType<typeof organogramService.getSections>>
  >([])
  const [designations, setDesignations] = React.useState<
    Awaited<ReturnType<typeof organogramService.getDesignations>>
  >([])
  const [lines, setLines] = React.useState<
    Awaited<ReturnType<typeof organogramService.getLines>>
  >([])
  const [groups, setGroups] = React.useState<
    Awaited<ReturnType<typeof organogramService.getGroups>>
  >([])
  const [shifts, setShifts] = React.useState<
    Awaited<ReturnType<typeof organogramService.getShifts>>
  >([])

  const bankBranches = React.useMemo(() => getBankBranches(bankName), [bankName])
  const isBankAccount = bankAccountType === "Bank Account"
  const selectedLine = lines.find((line) => line.id === lineId)

  const showDocumentsTab = mode === "edit" && !!employeeEntityId
  const tabs = showDocumentsTab ? [...BASE_TABS, DOCUMENTS_TAB] : [...BASE_TABS]

  const activeTabIndex = tabs.findIndex((t) => t.value === activeTab)
  const isFirstTab = activeTabIndex <= 0
  const isLastTab = activeTabIndex === tabs.length - 1
  const nextTab = !isLastTab ? tabs[activeTabIndex + 1] : null

  const grossSalary = parseFloat(grossSalaryInput) || 0
  const salaryBreakdown = calculateSalaryFromGross(grossSalary)

  React.useEffect(() => {
    if (!grossSalaryInput) return
    const breakdown = calculateSalaryFromGross(parseFloat(grossSalaryInput) || 0)
    setBasicSalary(String(breakdown.basicSalary))
    setHouseRent(String(breakdown.houseRent))
    setMedicalAllowance(String(breakdown.medicalAllowance))
    setConveyance(String(breakdown.conveyance))
    setFoodAllowance(String(breakdown.foodAllowance))
  }, [grossSalaryInput])

  React.useEffect(() => {
    if (selectedCompanyId) {
      organogramService.getDepartments({ companyId: selectedCompanyId }).then(setDepartments).catch(() => setDepartments([]))
      organogramService.getGroups({ companyId: selectedCompanyId }).then(setGroups).catch(() => setGroups([]))
      organogramService.getShifts({ companyId: selectedCompanyId }).then(setShifts).catch(() => setShifts([]))
    } else {
      setDepartments([])
      setGroups([])
      setShifts([])
    }
    setSections([])
    setDesignations([])
  }, [selectedCompanyId])

  React.useEffect(() => {
    if (departmentId) {
      organogramService.getSections({ departmentId }).then(setSections)
    } else {
      setSections([])
    }
    setDesignations([])
  }, [departmentId])

  React.useEffect(() => {
    if (sectionId) {
      organogramService.getDesignations({ sectionId }).then(setDesignations)
      organogramService.getLines({ sectionId }).then(setLines)
    } else {
      setDesignations([])
      setLines([])
    }
  }, [sectionId])

  React.useEffect(() => {
    if (lineId || !initial?.lineName || lines.length === 0) return
    const match = lines.find((line) => line.nameEn === initial.lineName)
    if (match) setLineId(match.id)
  }, [initial?.lineName, lineId, lines])

  React.useEffect(() => {
    if (groupId || !initial?.groupName || groups.length === 0) return
    const match = groups.find((group) => group.nameEn === initial.groupName)
    if (match) setGroupId(match.id)
  }, [initial?.groupName, groupId, groups])

  React.useEffect(() => {
    if (shiftId || !initial?.shiftName || shifts.length === 0) return
    const match = shifts.find((shift) => shift.nameEn === initial.shiftName)
    if (match) setShiftId(match.id)
  }, [initial?.shiftName, shiftId, shifts])

  const presentPayload = addressValueToPayload(presentAddress)
  const permanentPayload = addressValueToPayload(permanentAddress)

  const buildPayload = (): CreateEmployeeDto => ({
    companyId: selectedCompanyId || undefined,
    punchNumber: parseInt(punchNumber, 10),
    employeeId: normalizeHrEmployeeId(employeeId),
    fullNameEn,
    fullNameBn: fullNameBn || undefined,
    nid: nid || undefined,
    gender: gender || undefined,
    religion: religion || undefined,
    bloodGroup: bloodGroup || undefined,
    fatherNameEn: fatherNameEn || undefined,
    fatherNameBn: fatherNameBn || undefined,
    motherNameEn: motherNameEn || undefined,
    motherNameBn: motherNameBn || undefined,
    maritalStatus: maritalStatus || undefined,
    spouseNameEn: spouseNameEn || undefined,
    spouseNameBn: spouseNameBn || undefined,
    spouseOccupation: spouseOccupation || undefined,
    spouseContact: spouseContact || undefined,
    educationLevel: educationLevel || undefined,
    institution: institution || undefined,
    fieldOfStudy: fieldOfStudy || undefined,
    skills: skills || undefined,
    reference1Name: reference1Name || undefined,
    reference1Relation: reference1Relation || undefined,
    reference1Phone: reference1Phone || undefined,
    reference1Address: reference1Address || undefined,
    reference2Name: reference2Name || undefined,
    reference2Relation: reference2Relation || undefined,
    reference2Phone: reference2Phone || undefined,
    reference2Address: reference2Address || undefined,
    dateOfBirth: dob?.toISOString(),
    departmentId,
    sectionId: sectionId || undefined,
    designationId,
    lineId: lineId || undefined,
    lineName: selectedLine?.nameEn,
    groupId: groupId || undefined,
    shiftId: shiftId || undefined,
    status,
    joinDate: joinDate?.toISOString() ?? new Date().toISOString(),
    email: email || undefined,
    phoneNumber: phone || undefined,
    grossSalary: grossSalary || undefined,
    basicSalary: parseFloat(basicSalary) || 0,
    houseRent: parseFloat(houseRent) || 0,
    medicalAllowance: parseFloat(medicalAllowance) || 0,
    conveyance: parseFloat(conveyance) || 0,
    foodAllowance: parseFloat(foodAllowance) || 0,
    presentAddress: presentPayload.addressLine,
    presentDivision: presentPayload.division,
    presentDistrict: presentPayload.district,
    presentUpazila: presentPayload.upazila,
    presentPostOffice: presentPayload.postOffice,
    presentPostalCode: presentPayload.postalCode,
    permanentAddress: permanentPayload.addressLine,
    permanentDivision: permanentPayload.division,
    permanentDistrict: permanentPayload.district,
    permanentUpazila: permanentPayload.upazila,
    permanentPostOffice: permanentPayload.postOffice,
    permanentPostalCode: permanentPayload.postalCode,
    bankName: isBankAccount ? bankName || undefined : undefined,
    bankBranchName: isBankAccount ? bankBranchName || undefined : undefined,
    bankAccountNo: bankAccountNo || undefined,
    bankAccountType,
    profileImageUrl: profileImageUrl || undefined,
    signatureImageUrl: signatureImageUrl || undefined,
    emergencyContactName: emergencyContactName || undefined,
    emergencyContactRelation: emergencyContactRelation || undefined,
    emergencyContactPhone: emergencyContactPhone || undefined,
    emergencyContactAddress: emergencyContactAddress || undefined,
    isOtEnabled,
  })

  const validatePersonalTab = (): boolean => {
    if (!fullNameEn.trim()) {
      toast.error("Full name is required")
      return false
    }
    if (!punchNumber || parseInt(punchNumber, 10) <= 0) {
      toast.error("Valid punch number is required")
      return false
    }
    if (!joinDate) {
      toast.error("Join date is required")
      return false
    }
    if (employeeId.trim() && !isValidHrEmployeeId(employeeId)) {
      toast.error(
        "Employee ID must be 1-32 characters without spaces, or leave empty to auto-generate.",
      )
      return false
    }
    return true
  }

  const validateEmploymentTab = (): boolean => {
    if (!selectedCompanyId) {
      toast.error("Select a company")
      return false
    }
    if (!departmentId || !designationId) {
      toast.error("Department and designation are required")
      return false
    }
    return true
  }

  const validateCurrentTab = (tab: TabValue): boolean => {
    if (tab === "personal") return validatePersonalTab()
    if (tab === "employment") return validateEmploymentTab()
    return true
  }

  const validateAll = (): boolean => {
    if (!validatePersonalTab()) return false
    if (!validateEmploymentTab()) return false
    return true
  }

  const canSubmitCreate = React.useMemo(() => {
    if (mode !== "create") return false
    if (!fullNameEn.trim()) return false
    if (!punchNumber || parseInt(punchNumber, 10) <= 0) return false
    if (!joinDate) return false
    if (employeeId.trim() && !isValidHrEmployeeId(employeeId)) return false
    if (!selectedCompanyId) return false
    if (!departmentId || !designationId) return false
    return true
  }, [
    mode,
    fullNameEn,
    punchNumber,
    joinDate,
    employeeId,
    selectedCompanyId,
    departmentId,
    designationId,
  ])

  const handleNext = () => {
    if (!validateCurrentTab(activeTab)) return
    if (nextTab) setActiveTab(nextTab.value)
  }

  const handlePrevious = () => {
    if (isFirstTab) return
    setActiveTab(tabs[activeTabIndex - 1].value)
  }

  const copyPresentToPermanent = () => {
    setPermanentAddress({ ...presentAddress })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return

    setIsLoading(true)
    try {
      const base = buildPayload()
      if (mode === "edit") {
        await onSubmit({ ...base, isActive, isOtEnabled } as UpdateEmployeeDto)
      } else {
        await onSubmit({ ...base, isOtEnabled } as CreateEmployeeDto)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const submitButtonLabel =
    submitLabel ??
    (mode === "create" ? "Create employee" : "Update employee")

  return (
    <form onSubmit={handleSubmit} className={employeeFormFieldsCn("flex flex-col gap-6")}>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabValue)}
        className="flex w-full min-w-0 flex-col"
      >
        <TabsList className="mb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.value} value={tab.value}>
                <Icon className="size-3.5 shrink-0" />
                <span>{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="personal" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconUser className="size-4 text-primary" />
                Personal information
              </CardTitle>
              <CardDescription>Identity and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Punch number (device badge) *</Label>
                <Input
                  type="number"
                  min={1}
                  value={punchNumber}
                  onChange={(e) => setPunchNumber(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Employee ID</Label>
                <Input
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  readOnly={mode === "edit"}
                  disabled={mode === "edit"}
                  placeholder="Leave empty for auto (EMP-0001) or enter your ID (e.g. 2514, Lo-0001)"
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Full name (English) *</Label>
                <Input value={fullNameEn} onChange={(e) => setFullNameEn(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label>Full name (Bangla)</Label>
                <Input
                  className="font-sutonny text-lg"
                  value={fullNameBn}
                  onChange={(e) => setFullNameBn(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>NID</Label>
                <Input value={nid} onChange={(e) => setNid(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Gender</Label>
                <NativeSelect value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">—</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Religion</Label>
                <NativeSelect value={religion} onChange={(e) => setReligion(e.target.value)}>
                  <option value="">—</option>
                  {EMPLOYEE_RELIGIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Blood group</Label>
                <NativeSelect value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                  <option value="">—</option>
                  {EMPLOYEE_BLOOD_GROUPS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Date of birth</Label>
                <DatePicker
                  date={dob}
                  setDate={setDob}
                  placeholder="dd/mm/yyyy"
                  size="medium"
                  variant="input"
                  toYear={new Date().getFullYear()}
                />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Probation">Probation</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Join date *</Label>
                <DatePicker
                  date={joinDate}
                  setDate={setJoinDate}
                  placeholder="dd/mm/yyyy"
                  size="medium"
                  variant="input"
                />
              </div>
              {mode === "edit" && (
                <div className="grid gap-2 items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    Active account
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="family" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconUsers className="size-4 text-primary" />
                Family information
              </CardTitle>
              <CardDescription>Parents, marital status, and spouse details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Father&apos;s name (English)</Label>
                <Input value={fatherNameEn} onChange={(e) => setFatherNameEn(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Father&apos;s name (Bangla)</Label>
                <Input
                  className="font-sutonny text-lg"
                  value={fatherNameBn}
                  onChange={(e) => setFatherNameBn(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Mother&apos;s name (English)</Label>
                <Input value={motherNameEn} onChange={(e) => setMotherNameEn(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Mother&apos;s name (Bangla)</Label>
                <Input
                  className="font-sutonny text-lg"
                  value={motherNameBn}
                  onChange={(e) => setMotherNameBn(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Marital status</Label>
                <NativeSelect value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)}>
                  <option value="">—</option>
                  {EMPLOYEE_MARITAL_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Spouse name (English)</Label>
                <Input value={spouseNameEn} onChange={(e) => setSpouseNameEn(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Spouse name (Bangla)</Label>
                <Input
                  className="font-sutonny text-lg"
                  value={spouseNameBn}
                  onChange={(e) => setSpouseNameBn(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Spouse occupation</Label>
                <Input value={spouseOccupation} onChange={(e) => setSpouseOccupation(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Spouse contact</Label>
                <Input value={spouseContact} onChange={(e) => setSpouseContact(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconBriefcase className="size-4 text-primary" />
                Employment
              </CardTitle>
              <CardDescription>Company and job placement.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2">
                <Label>Company *</Label>
                <NativeSelect
                  value={selectedCompanyId}
                  onChange={(e) => {
                    setSelectedCompanyId(parseInt(e.target.value, 10))
                    setShiftId(0)
                  }}
                  required
                >
                  <option value={0}>Select company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyNameEn}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Department *</Label>
                <NativeSelect
                  value={departmentId}
                  disabled={!selectedCompanyId}
                  onChange={(e) => {
                    setDepartmentId(parseInt(e.target.value, 10))
                    setSectionId(0)
                    setDesignationId(0)
                    setLineId(0)
                  }}
                  required
                >
                  <option value={0}>Select</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameEn}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Section</Label>
                <NativeSelect
                  value={sectionId}
                  disabled={!departmentId}
                  onChange={(e) => {
                    setSectionId(parseInt(e.target.value, 10))
                    setDesignationId(0)
                    setLineId(0)
                  }}
                >
                  <option value={0}>—</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameEn}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Designation *</Label>
                <NativeSelect
                  value={designationId}
                  disabled={!departmentId}
                  onChange={(e) => setDesignationId(parseInt(e.target.value, 10))}
                  required
                >
                  <option value={0}>Select</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameEn}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Line</Label>
                <NativeSelect
                  value={lineId}
                  disabled={!sectionId}
                  onChange={(e) => setLineId(parseInt(e.target.value, 10))}
                >
                  <option value={0}>Select line</option>
                  {lines.map((line) => (
                    <option key={line.id} value={line.id}>
                      {line.nameEn}
                    </option>
                  ))}
                  {initial?.lineName &&
                  lineId === 0 &&
                  !lines.some((line) => line.nameEn === initial.lineName) ? (
                    <option value={0} disabled>
                      {initial.lineName} (select section to reload)
                    </option>
                  ) : null}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Group</Label>
                <NativeSelect
                  value={groupId}
                  disabled={!selectedCompanyId}
                  onChange={(e) => setGroupId(parseInt(e.target.value, 10))}
                >
                  <option value={0}>—</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.nameEn}
                    </option>
                  ))}
                  {initial?.groupName &&
                  groupId === 0 &&
                  !groups.some((group) => group.nameEn === initial.groupName) ? (
                    <option value={0} disabled>
                      {initial.groupName} (reload company groups)
                    </option>
                  ) : null}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Shift</Label>
                <NativeSelect
                  value={shiftId}
                  disabled={!selectedCompanyId}
                  onChange={(e) => setShiftId(parseInt(e.target.value, 10))}
                >
                  <option value={0}>Select shift</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.nameEn} ({shift.inTime}-{shift.outTime})
                    </option>
                  ))}
                  {initial?.shiftName &&
                  shiftId === 0 &&
                  !shifts.some((shift) => shift.nameEn === initial.shiftName) ? (
                    <option value={0} disabled>
                      {initial.shiftName} (reload company shifts)
                    </option>
                  ) : null}
                </NativeSelect>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                  <div className="grid gap-0.5">
                    <Label htmlFor="ot-status">OT status</Label>
                    <p className="text-xs text-muted-foreground">
                      {isOtEnabled
                        ? "Overtime is enabled for this employee"
                        : "Overtime is disabled for this employee"}
                    </p>
                  </div>
                  <Switch
                    id="ot-status"
                    checked={isOtEnabled}
                    onCheckedChange={setIsOtEnabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconCurrencyTaka className="size-4 text-primary" />
                Salary structure
              </CardTitle>
              <CardDescription>
                Enter gross salary — basic, house rent, and allowances are calculated automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2 max-w-xs">
                <Label>Gross salary *</Label>
                <Input
                  type="number"
                  min={0}
                  value={grossSalaryInput}
                  onChange={(e) => setGrossSalaryInput(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 w-fit min-w-[200px]">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                  Calculated gross
                </p>
                <p className="text-2xl font-black text-primary">
                  ৳ {salaryBreakdown.grossSalary.toLocaleString()}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ["Basic", basicSalary],
                  ["House rent", houseRent],
                  ["Medical", medicalAllowance],
                  ["Conveyance", conveyance],
                  ["Food", foodAllowance],
                ].map(([label, val]) => (
                  <div key={label as string} className="grid gap-2">
                    <Label>{label as string}</Label>
                    <Input type="number" min={0} value={val as string} readOnly className="bg-muted/50" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconMapPin className="size-4 text-primary" />
                Addresses
              </CardTitle>
              <CardDescription>Select division, district, upazila, and post office from master data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <EmployeeAddressSection
                label="Present address"
                value={presentAddress}
                onChange={setPresentAddress}
              />
              <EmployeeAddressSection
                label="Permanent address"
                value={permanentAddress}
                onChange={setPermanentAddress}
                onCopyFrom={copyPresentToPermanent}
                copyLabel="Copy present to permanent"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconBuildingBank className="size-4 text-primary" />
                Bank account
              </CardTitle>
              <CardDescription>Payment account for salary disbursement.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2">
                <Label>Account type</Label>
                <NativeSelect
                  value={bankAccountType}
                  onChange={(e) => {
                    setBankAccountType(e.target.value)
                    if (e.target.value === "mCash Account") {
                      setBankName("")
                      setBankBranchName("")
                    }
                  }}
                >
                  <option value="Bank Account">Bank Account</option>
                  <option value="mCash Account">mCash Account</option>
                </NativeSelect>
              </div>
              {isBankAccount ? (
                <>
                  <div className="grid gap-2">
                    <Label>Bank name</Label>
                    <NativeSelect
                      value={bankName}
                      onChange={(e) => {
                        setBankName(e.target.value)
                        setBankBranchName("")
                      }}
                    >
                      <option value="">Select bank</option>
                      {BANGLADESH_BANKS.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                      {bankName && !BANGLADESH_BANKS.some((b) => b.name === bankName) ? (
                        <option value={bankName}>{bankName}</option>
                      ) : null}
                    </NativeSelect>
                  </div>
                  <div className="grid gap-2">
                    <Label>Branch</Label>
                    <NativeSelect
                      value={bankBranchName}
                      disabled={!bankName}
                      onChange={(e) => setBankBranchName(e.target.value)}
                    >
                      <option value="">Select branch</option>
                      {bankBranches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                      {bankBranchName && !bankBranches.includes(bankBranchName) ? (
                        <option value={bankBranchName}>{bankBranchName}</option>
                      ) : null}
                    </NativeSelect>
                  </div>
                </>
              ) : null}
              <div className={`grid gap-2 ${isBankAccount ? "sm:col-span-2" : "sm:col-span-2"}`}>
                <Label>{isBankAccount ? "Account no" : "mCash account no"}</Label>
                <Input value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconPhoneCall className="size-4 text-primary" />
                Emergency contact
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Relation</Label>
                <Input
                  value={emergencyContactRelation}
                  onChange={(e) => setEmergencyContactRelation(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Address</Label>
                <Input
                  value={emergencyContactAddress}
                  onChange={(e) => setEmergencyContactAddress(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconSchool className="size-4 text-primary" />
                Educational and skills
              </CardTitle>
              <CardDescription>Academic background and professional skills.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Education level</Label>
                <NativeSelect value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}>
                  <option value="">—</option>
                  {EMPLOYEE_EDUCATION_LEVELS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label>Institution</Label>
                <Input value={institution} onChange={(e) => setInstitution(e.target.value)} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Field of study</Label>
                <Input value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Skills</Label>
                <Textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="List relevant skills, certifications, or training"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="references" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconUsersGroup className="size-4 text-primary" />
                References
              </CardTitle>
              <CardDescription>Professional or personal references.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label className="text-muted-foreground">Reference 1</Label>
                </div>
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={reference1Name} onChange={(e) => setReference1Name(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Relation</Label>
                  <Input value={reference1Relation} onChange={(e) => setReference1Relation(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input value={reference1Phone} onChange={(e) => setReference1Phone(e.target.value)} />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label>Address</Label>
                  <Input value={reference1Address} onChange={(e) => setReference1Address(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 border-t pt-6">
                <div className="grid gap-2 sm:col-span-2">
                  <Label className="text-muted-foreground">Reference 2</Label>
                </div>
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={reference2Name} onChange={(e) => setReference2Name(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Relation</Label>
                  <Input value={reference2Relation} onChange={(e) => setReference2Relation(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input value={reference2Phone} onChange={(e) => setReference2Phone(e.target.value)} />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label>Address</Label>
                  <Input value={reference2Address} onChange={(e) => setReference2Address(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IconPhoto className="size-4 text-primary" />
                Profile & signature
              </CardTitle>
              <CardDescription>Employee photo and signature for HR documents and payslips.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 lg:grid-cols-2">
              <EmployeeImageField
                label="Profile picture"
                description="Used on employee list and ID card views."
                value={profileImageUrl}
                onChange={setProfileImageUrl}
                variant="profile"
                employeeEntityId={employeeEntityId}
                companyId={selectedCompanyId || undefined}
              />
              <EmployeeImageField
                label="Signature"
                description="Used on payslips and official HR documents."
                value={signatureImageUrl}
                onChange={setSignatureImageUrl}
                variant="signature"
                employeeEntityId={employeeEntityId}
                companyId={selectedCompanyId || undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {showDocumentsTab && employeeEntityId ? (
          <TabsContent value="documents" className="mt-4">
            <EmployeeDocumentsPanel
              employeeEntityId={employeeEntityId}
              documents={documents}
              onChanged={() => onDocumentsChanged?.()}
            />
          </TabsContent>
        ) : null}
      </Tabs>

      <div className="sticky bottom-0 z-10 flex flex-col gap-4 border-t bg-background/95 py-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} className={employeeFormActionButtonClass}>
              Cancel
            </Button>
          ) : null}
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Tab {activeTabIndex + 1} of {tabs.length}
          </span>
          <div className="flex items-center gap-1">
            {tabs.map((tab, index) => (
              <span
                key={tab.value}
                className={cn(
                  "size-2 rounded-full transition-colors",
                  index === activeTabIndex ? "bg-primary" : "bg-muted-foreground/30",
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          {!isFirstTab ? (
            <Button type="button" variant="outline" onClick={handlePrevious} className={cn("gap-1", employeeFormActionButtonClass)}>
              <IconArrowLeft className="size-4" />
              Previous
            </Button>
          ) : null}
          {mode === "edit" ? (
            <>
              {!isLastTab && nextTab ? (
                <Button type="button" variant="outline" onClick={handleNext} className={cn("gap-1", employeeFormActionButtonClass)}>
                  Next: {nextTab.label}
                  <IconArrowRight className="size-4" />
                </Button>
              ) : null}
              <Button type="submit" disabled={isLoading} className={cn("gap-2", employeeFormActionButtonClass)}>
                {isLoading ? (
                  <IconLoader className="size-4 animate-spin" />
                ) : (
                  <IconCheck className="size-4" />
                )}
                {submitButtonLabel}
              </Button>
            </>
          ) : (
            <>
              {!isLastTab && nextTab ? (
                <Button type="button" onClick={handleNext} className={cn("gap-1", employeeFormActionButtonClass)}>
                  Next: {nextTab.label}
                  <IconArrowRight className="size-4" />
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={isLoading || !canSubmitCreate}
                className={cn("gap-2", employeeFormActionButtonClass)}
              >
                {isLoading ? (
                  <IconLoader className="size-4 animate-spin" />
                ) : (
                  <IconCheck className="size-4" />
                )}
                {submitButtonLabel}
              </Button>
            </>
          )}
        </div>
      </div>
    </form>
  )
}
