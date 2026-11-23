export type CleanupDownloadState = 'in_progress' | 'interrupted' | 'complete'

export type CleanupDownloadItem = {
  id?: number
  exists?: boolean | null
  filename?: string
  finalUrl?: string
  startTime?: string
  state?: CleanupDownloadState
  totalBytes?: number
  url?: string
}

export type DownloadCleanupStatus = 'existing' | 'missing' | 'unknown'

export type ClassifiedDownloadItem = CleanupDownloadItem & {
  id: number
  cleanupStatus: DownloadCleanupStatus
}

export type DownloadCleanupSummary = {
  existing: ClassifiedDownloadItem[]
  missing: ClassifiedDownloadItem[]
  unknown: ClassifiedDownloadItem[]
}

export function classifyDownloadForCleanup(
  item: CleanupDownloadItem,
): DownloadCleanupStatus {
  // exists 仅对已完成下载可靠；进行中/中断下载的目标文件尚未落盘。
  if (item.state !== 'complete' || typeof item.id !== 'number') {
    return 'unknown'
  }

  if (item.exists === false) {
    return 'missing'
  }

  if (item.exists === true) {
    return 'existing'
  }

  return 'unknown'
}

export function classifyDownloadsForCleanup(
  items: CleanupDownloadItem[],
): DownloadCleanupSummary {
  const summary: DownloadCleanupSummary = {
    existing: [],
    missing: [],
    unknown: [],
  }

  for (const item of items) {
    const cleanupStatus = classifyDownloadForCleanup(item)
    const classifiedItem: ClassifiedDownloadItem = {
      ...item,
      id: typeof item.id === 'number' ? item.id : -1,
      cleanupStatus,
    }

    summary[cleanupStatus].push(classifiedItem)
  }

  return summary
}

export function getCleanupCandidates(
  items: CleanupDownloadItem[],
): ClassifiedDownloadItem[] {
  return classifyDownloadsForCleanup(items).missing
}

export function getCleanupIds(items: CleanupDownloadItem[]): number[] {
  return getCleanupCandidates(items).map((item) => item.id)
}
