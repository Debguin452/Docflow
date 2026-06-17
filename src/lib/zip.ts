import JSZip from 'jszip'

export async function downloadAsZip(
  files: Array<{ name: string; data: Uint8Array | Blob }>,
  zipName: string,
): Promise<void> {
  const zip = new JSZip()
  for (const f of files) {
    zip.file(f.name, f.data)
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = zipName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
