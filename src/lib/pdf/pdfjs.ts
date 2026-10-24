// Single place to load pdf.js and configure its worker.
// pdfjs-dist v3.x ships the worker as build/pdf.worker.min.js (not .mjs),
// so we import it with Vite's ?url suffix to get a hashed asset URL.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url'

let configured = false

export async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist')
  if (!configured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
    configured = true
  }
  return pdfjsLib
}
