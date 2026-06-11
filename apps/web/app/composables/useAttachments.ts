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
  const previewUrls = ref(new Map<File, string>())

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
      if (f.type.startsWith('image/')) {
        const map = new Map(previewUrls.value)
        map.set(f, URL.createObjectURL(f))
        previewUrls.value = map
      }
      attachments.value = [...attachments.value, f]
    }
    error.value = ''
  }

  function removeAttachment(idx: number) {
    const f = attachments.value[idx]
    if (f) {
      const url = previewUrls.value.get(f)
      if (url) {
        URL.revokeObjectURL(url)
        const map = new Map(previewUrls.value)
        map.delete(f)
        previewUrls.value = map
      }
    }
    attachments.value = attachments.value.filter((_, i) => i !== idx)
  }

  onUnmounted(() => {
    for (const url of previewUrls.value.values()) {
      URL.revokeObjectURL(url)
    }
  })

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
    handleFileInput,
    addFiles,
    removeAttachment,
    buildAttachmentPayload,
    previewUrls,
    isMaxed,
    MAX_FILES,
    MAX_SIZE,
  }
}
