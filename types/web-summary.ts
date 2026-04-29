export interface WebSummaryConfig {
  endpoint: string
  model: string
  apiKey: string
}

export interface WebSummaryPageContent {
  title: string
  url: string
  content: string
  source: 'article' | 'main' | 'body'
  truncated: boolean
  charCount: number
}

export type WebSummaryPendingAction = {
  type: 'SUMMARIZE_ACTIVE_PAGE'
  tabId: number
}

export type OpenWebSummaryMessage = {
  type: 'OPEN_WEB_SUMMARY'
  tabId?: number
}

export type WebSummarySidePanelReadyMessage = {
  type: 'WEB_SUMMARY_SIDE_PANEL_READY'
  tabId?: number
}

export type WebSummaryExtractPageMessage = {
  type: 'WEB_SUMMARY_EXTRACT_PAGE'
}

export type WebSummaryMessage =
  | OpenWebSummaryMessage
  | WebSummarySidePanelReadyMessage
  | WebSummaryExtractPageMessage

export interface OpenWebSummaryResponse {
  ok: boolean
  tabId?: number
  error?: string
}
