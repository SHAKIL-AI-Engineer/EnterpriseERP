export type ImageUploadPreset = "avatar" | "signature"

const PRESETS: Record<
  ImageUploadPreset,
  { maxWidth: number; maxHeight: number; quality: number; maxInputBytes: number }
> = {
  avatar: {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.82,
    maxInputBytes: 5 * 1024 * 1024,
  },
  signature: {
    maxWidth: 800,
    maxHeight: 320,
    quality: 0.85,
    maxInputBytes: 5 * 1024 * 1024,
  },
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Could not read image file."))
    }
    img.src = url
  })
}

function scaleDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
) {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

/**
 * Resize and compress an image in the browser before upload (WebP when supported).
 */
export async function optimizeImageFile(
  file: File,
  preset: ImageUploadPreset = "avatar",
): Promise<File> {
  const config = PRESETS[preset]
  if (file.size > config.maxInputBytes) {
    throw new Error("Image must be 5 MB or smaller.")
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.")
  }

  const img = await loadImage(file)
  const { width, height } = scaleDimensions(
    img.naturalWidth,
    img.naturalHeight,
    config.maxWidth,
    config.maxHeight,
  )

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not process image.")
  }
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result)
        else reject(new Error("Could not compress image."))
      },
      "image/webp",
      config.quality,
    )
  })

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image"
  return new File([blob], `${baseName}.webp`, { type: "image/webp" })
}
