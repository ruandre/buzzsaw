// Delayed revoke prevents Safari aborting download
const REVOKE_DELAY_MS = 200

/** Triggers browser file download for a Blob; no-op in non-DOM environments */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') {
    return
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.style.display = 'none'
  anchor.href = url
  anchor.download = filename

  document.body.appendChild(anchor)
  anchor.click()

  setTimeout(() => {
    anchor.remove()
    URL.revokeObjectURL(url)
  }, REVOKE_DELAY_MS)
}

export function downloadJson(data: unknown, filename: string): void {
  downloadBlob(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    filename,
  )
}
