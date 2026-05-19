import {
  getJsonStringSettings,
  REQUEST_DATA_STORAGE_KEY,
  shouldCaptureJsonRequest,
  subscribeJsonStringSettings,
  type JsonRequestLike,
} from '@/lib/fe-tools/json-string'

type CapturedRequest = {
  request: chrome.devtools.network.Request['request']
  response: chrome.devtools.network.Request['response']
  content: string
}

async function getCapturedRequests(): Promise<CapturedRequest[]> {
  const result = await chrome.storage.local.get(REQUEST_DATA_STORAGE_KEY)
  return (result[REQUEST_DATA_STORAGE_KEY] as CapturedRequest[] | undefined) ?? []
}

let jsonStringEnabled = false
let jsonStringPanelCreated = false

function clearCapturedRequests() {
  void chrome.storage.local.set({ [REQUEST_DATA_STORAGE_KEY]: [] })
}

function createJsonStringPanel() {
  if (jsonStringPanelCreated) {
    return
  }

  jsonStringPanelCreated = true
  chrome.devtools.panels.create('Json String', '', 'json-string-panel.html')
}

function applyJsonStringSettings(enabled: boolean) {
  jsonStringEnabled = enabled

  if (enabled) {
    createJsonStringPanel()
    return
  }

  clearCapturedRequests()
}

clearCapturedRequests()
void getJsonStringSettings().then((settings) => {
  applyJsonStringSettings(settings.enabled)
})

subscribeJsonStringSettings((settings) => {
  applyJsonStringSettings(settings.enabled)
})

chrome.devtools.network.onRequestFinished.addListener((request) => {
  if (!jsonStringEnabled) {
    return
  }

  if (!shouldCaptureJsonRequest(request as JsonRequestLike)) {
    return
  }

  request.getContent((content) => {
    void getCapturedRequests().then((requestData) =>
      chrome.storage.local.set({
        [REQUEST_DATA_STORAGE_KEY]: [
          ...requestData,
          {
            request: request.request,
            response: request.response,
            content,
          },
        ],
      }),
    )
  })
})
