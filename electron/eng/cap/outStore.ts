import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import type { OutCfg } from '../../../shared/outCfg'
import { migrateOutCfg, mkOutCfg } from '../../../shared/outCfg'
import type { StrmCfg } from '../../../shared/types'
import type { MedOutCfg } from '../../../shared/medOut'
import { normMedOutCfg } from '../../../shared/medOut'

const OUT_FILE = 'outCfg.json'
const STRM_FILE = 'strmCfg.json'
const MED_OUT_FILE = 'medOutCfg.json'
const FIX_DIR = 'fixture-library'
const FIX_FILE = 'captivate-fixtures.captivate-fixtures'

function cfgPath(name: string) {
  return path.join(app.getPath('userData'), name)
}

export function loadOutCfg(): OutCfg {
  try {
    const raw = JSON.parse(fs.readFileSync(cfgPath(OUT_FILE), 'utf8'))
    return migrateOutCfg(raw)
  } catch {
    return mkOutCfg()
  }
}

export function saveOutCfg(cfg: OutCfg) {
  fs.mkdirSync(path.dirname(cfgPath(OUT_FILE)), { recursive: true })
  fs.writeFileSync(cfgPath(OUT_FILE), JSON.stringify(cfg, null, 2))
}

export function loadStrmCfg(defaults: StrmCfg): StrmCfg {
  try {
    const raw = fs.readFileSync(cfgPath(STRM_FILE), 'utf8')
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

export function saveStrmCfg(cfg: StrmCfg) {
  fs.mkdirSync(path.dirname(cfgPath(STRM_FILE)), { recursive: true })
  fs.writeFileSync(cfgPath(STRM_FILE), JSON.stringify(cfg, null, 2))
}

export function loadMedOutCfg(): MedOutCfg {
  try {
    const raw = JSON.parse(fs.readFileSync(cfgPath(MED_OUT_FILE), 'utf8'))
    return normMedOutCfg(raw)
  } catch {
    return normMedOutCfg(null)
  }
}

export function saveMedOutCfg(cfg: MedOutCfg) {
  fs.mkdirSync(path.dirname(cfgPath(MED_OUT_FILE)), { recursive: true })
  fs.writeFileSync(cfgPath(MED_OUT_FILE), JSON.stringify(cfg, null, 2))
}

export function defaultFixLibPath() {
  return path.join(app.getPath('userData'), FIX_DIR, FIX_FILE)
}

export function readDefaultFixLib(): string | null {
  try {
    return fs.readFileSync(defaultFixLibPath(), 'utf8')
  } catch {
    return null
  }
}

export function saveDefaultFixLib(serialized: string) {
  const p = defaultFixLibPath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, serialized)
  return p
}
