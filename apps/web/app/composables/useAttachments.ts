/**
 * Shared attachment handling — DRYs up fileToBase64, file validation,
 * and file input management used by booking and contact forms.
 */
export function useAttachments(options?: {
  maxFiles?: number
  maxSize?: number
  allowedTypes?: string[]
}) {
  const MAX_FILES = options?.maxFiles ?? 3
  const MAX_SIZE = options?.maxSize ?? 5 * 1024 * 1024 // 5 MB
  const ALLOWED_TYPES = options?.allowedTypes ?? [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
  ]

  const attachments = ref<File[]>([])
  const error = ref('')
  const imageInputRef = ref<HTMLInputElement | null>(null)
  const fileInputRef = ref<HTMLInputElement | null>(null)

  function pickImages() { imageInputRef.value?.click() }
  function pickFiles() { fileInputRef.value?.click() }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files) return
    addFiles(Array.from(input.files))
    input.value = ''
  }

  function addFiles(files: File[]) {
    for (const f of files) {
      if (attachments.value.length >= MAX_FILES) return
      if (!ALLOWED_TYPES.includes(f.type)) {
        error.value = `Tipul fișierului ${f.name} nu este acceptat.`
        return
      }
      if (f.size > MAX_SIZE) {
        error.value = `Fișierul ${f.name} depășește ${MAX_SIZE / 1024 / 1024} MB.`
        return
      }
      attachments.value = [...attachments.value, f]
    }
    error.value = ''
  }

  function removeAttachment(idx: number) {
    attachments.value = attachments.value.filter((_, i) => i !== idx)
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1] ?? '')
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function buildAttachmentPayload() {
    if (!attachments.value.length) return undefined
    return Promise.all(
      attachments.value.map(async (f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
        data: await fileToBase64(f),
      })),
    )
  }

  const isMaxed = computed(() => attachments.value.length >= MAX_FILES)

  return {
    attachments,
    error: readonly(error),
    imageInputRef,
    fileInputRef,
    pickImages,
    pickFiles,
    handleFileInput,
    addFiles,
    removeAttachment,
    buildAttachmentPayload,
    isMaxed,
    MAX_FILES,
    MAX_SIZE,
  }
}
