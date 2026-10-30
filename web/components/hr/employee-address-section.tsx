"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { employeeFormFieldsCn } from "@/components/hr/employee-form-fields"
import {
  addressService,
  type Division,
  type District,
  type Thana,
  type PostOffice,
} from "@/lib/services/address"

export type EmployeeAddressFormValue = {
  divisionId: string
  districtId: string
  upazilaId: string
  postOfficeId: string
  addressLine: string
  postalCode: string
  divisionName?: string
  districtName?: string
  upazilaName?: string
  postOfficeName?: string
}

const EMPTY_ADDRESS: EmployeeAddressFormValue = {
  divisionId: "",
  districtId: "",
  upazilaId: "",
  postOfficeId: "",
  addressLine: "",
  postalCode: "",
}

type Props = {
  label: string
  value: EmployeeAddressFormValue
  onChange: (value: EmployeeAddressFormValue) => void
  onCopyFrom?: () => void
  copyLabel?: string
}

export function EmployeeAddressSection({
  label,
  value,
  onChange,
  onCopyFrom,
  copyLabel,
}: Props) {
  const [divisions, setDivisions] = React.useState<Division[]>([])
  const [districts, setDistricts] = React.useState<District[]>([])
  const [upazilas, setUpazilas] = React.useState<Thana[]>([])
  const [postOffices, setPostOffices] = React.useState<PostOffice[]>([])
  const [initialized, setInitialized] = React.useState(false)

  React.useEffect(() => {
    addressService.getDivisions().then(setDivisions).catch(() => setDivisions([]))
  }, [])

  React.useEffect(() => {
    if (!value.divisionId) {
      setDistricts([])
      return
    }
    addressService
      .getDistricts(value.divisionId)
      .then(setDistricts)
      .catch(() => setDistricts([]))
  }, [value.divisionId])

  React.useEffect(() => {
    if (!value.districtId) {
      setUpazilas([])
      return
    }
    addressService
      .getThanas(value.districtId)
      .then(setUpazilas)
      .catch(() => setUpazilas([]))
  }, [value.districtId])

  React.useEffect(() => {
    if (!value.upazilaId) {
      setPostOffices([])
      return
    }
    addressService
      .getPostOffices({ upazilaId: value.upazilaId })
      .then(setPostOffices)
      .catch(() => setPostOffices([]))
  }, [value.upazilaId])

  React.useEffect(() => {
    if (initialized || divisions.length === 0) return
    if (
      !value.divisionName &&
      !value.districtName &&
      !value.upazilaName &&
      !value.postOfficeName
    ) {
      setInitialized(true)
      return
    }

    const resolve = async () => {
      let next = { ...value }
      if (value.divisionName && !value.divisionId) {
        const division = divisions.find((d) => d.nameEn === value.divisionName)
        if (division) next = { ...next, divisionId: division.id }
      }
      if (next.divisionId && value.districtName && !value.districtId) {
        const districtRows = await addressService.getDistricts(next.divisionId)
        const district = districtRows.find((d) => d.nameEn === value.districtName)
        if (district) next = { ...next, districtId: district.id }
      }
      if (next.districtId && value.upazilaName && !value.upazilaId) {
        const upazilaRows = await addressService.getThanas(next.districtId)
        const upazila = upazilaRows.find((u) => u.nameEn === value.upazilaName)
        if (upazila) next = { ...next, upazilaId: upazila.id }
      }
      if (next.upazilaId && value.postOfficeName && !value.postOfficeId) {
        const poRows = await addressService.getPostOffices({ upazilaId: next.upazilaId })
        const po = poRows.find((p) => p.nameEn === value.postOfficeName)
        if (po) {
          next = {
            ...next,
            postOfficeId: po.id,
            postalCode: po.postalCode || next.postalCode,
          }
        }
      }
      if (
        next.divisionId !== value.divisionId ||
        next.districtId !== value.districtId ||
        next.upazilaId !== value.upazilaId ||
        next.postOfficeId !== value.postOfficeId ||
        next.postalCode !== value.postalCode
      ) {
        onChange(next)
      }
      setInitialized(true)
    }

    void resolve()
  }, [divisions, initialized, onChange, value])

  const patch = (partial: Partial<EmployeeAddressFormValue>) => {
    onChange({ ...value, ...partial })
  }

  const division = divisions.find((d) => d.id === value.divisionId)
  const district = districts.find((d) => d.id === value.districtId)
  const upazila = upazilas.find((u) => u.id === value.upazilaId)
  const postOffice = postOffices.find((p) => p.id === value.postOfficeId)

  return (
    <div className={employeeFormFieldsCn("space-y-4 rounded-lg border p-4")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{label}</p>
        {onCopyFrom ? (
          <Button type="button" variant="outline" size="sm" onClick={onCopyFrom}>
            {copyLabel ?? "Copy from present"}
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Division</Label>
          <NativeSelect
            value={value.divisionId}
            onChange={(e) =>
              patch({
                divisionId: e.target.value,
                districtId: "",
                upazilaId: "",
                postOfficeId: "",
                divisionName: divisions.find((d) => d.id === e.target.value)?.nameEn,
                districtName: "",
                upazilaName: "",
                postOfficeName: "",
              })
            }
          >
            <option value="">Select division</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nameEn}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label>District</Label>
          <NativeSelect
            value={value.districtId}
            disabled={!value.divisionId}
            onChange={(e) =>
              patch({
                districtId: e.target.value,
                upazilaId: "",
                postOfficeId: "",
                districtName: districts.find((d) => d.id === e.target.value)?.nameEn,
                upazilaName: "",
                postOfficeName: "",
              })
            }
          >
            <option value="">Select district</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nameEn}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label>Upazila / Thana</Label>
          <NativeSelect
            value={value.upazilaId}
            disabled={!value.districtId}
            onChange={(e) =>
              patch({
                upazilaId: e.target.value,
                postOfficeId: "",
                upazilaName: upazilas.find((u) => u.id === e.target.value)?.nameEn,
                postOfficeName: "",
              })
            }
          >
            <option value="">Select upazila</option>
            {upazilas.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nameEn}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label>Post office</Label>
          <NativeSelect
            value={value.postOfficeId}
            disabled={!value.upazilaId}
            onChange={(e) => {
              const po = postOffices.find((p) => p.id === e.target.value)
              patch({
                postOfficeId: e.target.value,
                postOfficeName: po?.nameEn,
                postalCode: po?.postalCode ?? value.postalCode,
              })
            }}
          >
            <option value="">Select post office</option>
            {postOffices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameEn} {p.postalCode ? `(${p.postalCode})` : ""}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label>Street / village / house</Label>
          <Input
            value={value.addressLine}
            onChange={(e) => patch({ addressLine: e.target.value })}
            placeholder="House, road, area details"
          />
        </div>
        <div className="grid gap-2">
          <Label>Postal code</Label>
          <Input
            value={value.postalCode}
            onChange={(e) => patch({ postalCode: e.target.value })}
            placeholder={postOffice?.postalCode ?? "Auto-filled from post office"}
          />
        </div>
        {(division || district || upazila || postOffice) && (
          <div className="grid gap-1 sm:col-span-2 text-xs text-muted-foreground">
            <span>
              Selected: {[division?.nameEn, district?.nameEn, upazila?.nameEn, postOffice?.nameEn]
                .filter(Boolean)
                .join(" → ")}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function emptyEmployeeAddress(initial?: Partial<EmployeeAddressFormValue>): EmployeeAddressFormValue {
  return { ...EMPTY_ADDRESS, ...initial }
}

export function addressValueToPayload(value: EmployeeAddressFormValue) {
  return {
    country: "Bangladesh",
    division: value.divisionName || undefined,
    district: value.districtName || undefined,
    upazila: value.upazilaName || undefined,
    postOffice: value.postOfficeName || undefined,
    postalCode: value.postalCode || undefined,
    addressLine: value.addressLine || undefined,
  }
}
