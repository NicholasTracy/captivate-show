/** Long-running task progress pushed from main to renderer */

export interface TaskProgress {
  label: string
  /** 0-100, or -1 for indeterminate */
  progress: number
}