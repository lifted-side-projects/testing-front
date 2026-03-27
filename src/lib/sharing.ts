import { toPng } from 'html-to-image'

export async function captureAndShare(element: HTMLElement, filename: string) {
  const dataUrl = await toPng(element, {
    pixelRatio: 3,
    quality: 0.95,
  })

  // Convert data URL to blob
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const file = new File([blob], `${filename}.png`, { type: 'image/png' })

  // Try Web Share API
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'ChemPrep — мой результат',
      })
      return
    } catch {
      // User cancelled or share failed — fall through to download
    }
  }

  // Fallback: download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.png`
  a.click()
  URL.revokeObjectURL(url)
}
