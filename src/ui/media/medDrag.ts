/** Same-window media bin drag payload (Electron-safe) */
let draggingAssetId: string | null = null
let dropConsumed = false

export function startMedDrag(assetId: string) {
  draggingAssetId = assetId
  dropConsumed = false
}

export function endMedDrag() {
  draggingAssetId = null
}

/** Electron may fire dragend before drop — defer clearing until after drop handlers run */
export function deferEndMedDrag() {
  window.setTimeout(() => endMedDrag(), 0)
}

export function peekMedDrag() {
  return draggingAssetId
}

export function takeMedDrag() {
  const id = draggingAssetId
  draggingAssetId = null
  return id
}

/** Resolve dragged asset id from module store or dataTransfer (drop only, once per drag) */
export function resolveMedDragId(e: { dataTransfer?: DataTransfer | null }): string | null {
  if (dropConsumed) return null

  let id = takeMedDrag()
  if (!id) {
    const dt = e.dataTransfer
    if (dt) {
      try {
        const custom = dt.getData('application/x-med-asset')
        if (custom) id = custom
        else {
          const plain = dt.getData('text/plain')
          if (plain.startsWith('med-asset:')) id = plain.slice('med-asset:'.length)
        }
      } catch {
        /* getData throws if called outside drop in some browsers */
      }
    }
  }

  if (id) dropConsumed = true
  return id
}

export function medDragActive() {
  return !!peekMedDrag()
}
