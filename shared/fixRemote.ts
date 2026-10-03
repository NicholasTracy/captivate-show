/** Remote fixture library URLs (Captivate 2 compatible) */

export const CAPTIVATE_FIX_LIB_REPO = 'NicholasTracy/captivate-fixture-library'
export const CAPTIVATE_FIX_LIB_BRANCH = 'main'
export const CAPTIVATE_FIX_LIB_API = `https://api.github.com/repos/${CAPTIVATE_FIX_LIB_REPO}/contents/fixtures`
export const QLC_FIX_LIB_API = 'https://api.github.com/repos/mcallegari/qlcplus/contents/resources/fixtures'
export const OFL_FIX_LIB_API = 'https://api.github.com/repos/OpenLightingProject/open-fixture-library/contents/fixtures'
export const OFL_MANUFACTURERS_URL =
  'https://raw.githubusercontent.com/OpenLightingProject/open-fixture-library/master/fixtures/manufacturers.json'

export type FixSource = 'captivate' | 'qlc' | 'ofl'

export interface GitHubItem {
  name: string
  path: string
  type: 'file' | 'dir'
  download_url: string | null
}

export interface FixMfr {
  key: string
  label: string
}

export interface FixFile {
  name: string
  path: string
  downloadUrl: string
}

export function fixFileLabel(source: FixSource, fileName: string) {
  if (source === 'captivate') return fileName.replace(/\.json$/i, '').replace(/-/g, ' ')
  return fileName
}

export async function fetchGitHubContents(url: string): Promise<GitHubItem[]> {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
  if (!res.ok) throw new Error(`GitHub request failed (${res.status})`)
  const data = (await res.json()) as unknown
  if (!Array.isArray(data)) throw new Error('Unexpected GitHub response')
  return data as GitHubItem[]
}

export async function loadManufacturers(source: FixSource): Promise<FixMfr[]> {
  if (source === 'ofl') {
    const res = await fetch(OFL_MANUFACTURERS_URL)
    if (!res.ok) throw new Error(`OFL request failed (${res.status})`)
    const payload = (await res.json()) as Record<string, { name?: string }>
    return Object.entries(payload)
      .filter(([k]) => k !== '$schema')
      .map(([key, val]) => ({ key, label: val?.name?.trim() || key }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }
  const url = source === 'captivate' ? CAPTIVATE_FIX_LIB_API : QLC_FIX_LIB_API
  const items = await fetchGitHubContents(url)
  return items
    .filter((e) => e.type === 'dir')
    .map((e) => ({
      key: e.name,
      label: source === 'captivate' ? e.name.replace(/-/g, ' ') : e.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export async function loadFixFiles(source: FixSource, mfrKey: string): Promise<FixFile[]> {
  const base = source === 'captivate' ? CAPTIVATE_FIX_LIB_API : source === 'qlc' ? QLC_FIX_LIB_API : OFL_FIX_LIB_API
  const ref = source === 'captivate' ? CAPTIVATE_FIX_LIB_BRANCH : 'master'
  const ext = source === 'qlc' ? '.qxf' : '.json'
  const url = `${base}/${encodeURIComponent(mfrKey)}?ref=${ref}`
  const items = await fetchGitHubContents(url)
  return items
    .filter((e) => e.type === 'file' && e.name.toLowerCase().endsWith(ext) && e.download_url)
    .map((e) => ({ name: e.name, path: e.path, downloadUrl: e.download_url! }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function downloadFixText(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed (${res.status})`)
  return res.text()
}
