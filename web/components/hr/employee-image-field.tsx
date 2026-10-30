"use client"

import * as React from "react"
import { IconLoader, IconPhoto, IconTrash, IconUpload } from "@tabler/icons-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { employeeFormFieldsCn } from "@/components/hr/employee-form-fields"
import { getImageUrl } from "@/lib/utils"
import { employeeService } from "@/lib/services/employee"
import { optimizeImageFile } from "@/lib/image-upload"
import { toast } from "sonner"

const MAX_URL_LENGTH = 500

type Props = {
  label: string
  description: string
  value: string
  onChange: (url: string) => void
  variant?: "profile" | "signature"
  /** When set, enables server upload (edit mode). */
  employeeEntityId?: string
  companyId?: number
}

export function EmployeeImageField({
  label,
  description,
  value,
  onChange,
  variant = "profile",
  employeeEntityId,
  companyId,
}: Props) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  const canUpload = Boolean(employeeEntityId)

  React.useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const displayUrl = previewUrl || (value ? getImageUrl(value) : null)

  const handleUpload = async (file: File) => {
    if (!employeeEntityId) return
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setIsUploading(true)
    try {
      const optimized = await optimizeImageFile(
        file,
        variant === "profile" ? "avatar" : "signature",
      )
      const result =
        variant === "profile"
          ? await employeeService.uploadProfilePicture(employeeEntityId, optimized, companyId)
          : await employeeService.uploadSignature(employeeEntityId, optimized, companyId)
      if (result.success && result.imageUrl) {
        onChange(result.imageUrl)
        setPreviewUrl(null)
        toast.success(variant === "profile" ? "Profile picture saved" : "Signature saved")
      } else {
        toast.error(result.message)
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to process image.")
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!employeeEntityId) {
      onChange("")
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      return
    }
    setIsUploading(true)
    try {
      const result =
        variant === "profile"
          ? await employeeService.removeProfilePicture(employeeEntityId, companyId)
          : await employeeService.removeSignature(employeeEntityId, companyId)
      if (result.success) {
        onChange("")
        if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
        toast.success(variant === "profile" ? "Profile picture removed" : "Signature removed")
      } else {
        toast.error(result.message)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInput = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Use JPG, PNG, or WebP")
      return
    }
    if (canUpload) {
      void handleUpload(file)
      return
    }
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
  }

  return (
    <div className={employeeFormFieldsCn("space-y-4")}>
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      <div
        className={
          variant === "profile"
            ? "mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border bg-muted/30"
            : "flex h-28 w-full max-w-md items-center justify-center overflow-hidden rounded-lg border bg-muted/30"
        }
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt={label} className="h-full w-full object-contain" />
        ) : (
          <IconPhoto className="size-12 text-muted-foreground/40" />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            handleFileInput(e.target.files?.[0])
            e.target.value = ""
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isUploading}
          onClick={() => fileRef.current?.click()}
        >
          {isUploading ? (
            <IconLoader className="size-4 animate-spin" />
          ) : (
            <IconUpload className="size-4" />
          )}
          {canUpload ? "Upload image" : "Preview from file"}
        </Button>
        {(value || previewUrl) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2"
            disabled={isUploading}
            onClick={() => void handleRemove()}
          >
            <IconTrash className="size-4" />
            Remove
          </Button>
        )}
      </div>

      {!canUpload ? (
        <div className="grid gap-2 max-w-md">
          <Label>Image URL</Label>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            maxLength={MAX_URL_LENGTH}
          />
          <p className="text-[10px] text-muted-foreground">
            Save the employee first to upload files, or paste a hosted URL (max {MAX_URL_LENGTH}{" "}
            characters).
          </p>
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground max-w-md">
          JPG, PNG, or WebP up to 5 MB. Images are resized and compressed before upload.
        </p>
      )}
    </div>
  )
}
