import { toPng } from 'html-to-image'

export async function captureAndShare(element: HTMLElement, filename: string) {
  // Temporarily expand the hidden wrapper so html-to-image can measure the element
  const wrapper = element.parentElement
  if (wrapper) {
    wrapper.style.width = 'auto'
    wrapper.style.height = 'auto'
    wrapper.style.overflow = 'visible'
  }

  const dataUrl = await toPng(element, {
    pixelRatio: 3,
    quality: 0.95,
    width: 360,
    height: 640,
    skipFonts: true,
  })

  // Restore hidden wrapper
  if (wrapper) {
    wrapper.style.width = '0'
    wrapper.style.height = '0'
    wrapper.style.overflow = 'hidden'
  }

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
