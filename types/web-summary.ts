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

export type WebSummaryOpenRequestedMessage = {
  type: 'WEB_SUMMARY_OPEN_REQUESTED'
  tabId: number
}

export type WebSummaryMessage =
  | OpenWebSummaryMessage
  | WebSummarySidePanelReadyMessage
  | WebSummaryOpenRequestedMessage

export interface OpenWebSummaryResponse {
  ok: boolean
  tabId?: number
  error?: string
}

export interface WebSummaryChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  status: 'complete' | 'streaming' | 'stopped' | 'error'
}

export interface WebSummaryConversation {
  id: string
  windowId: number
  tabId: number
  page: WebSummaryPageContent
  createdAt: number
  messages: WebSummaryChatMessage[]
  memory: string
  memoryThrough: number
}

export interface WebSummaryModelMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
