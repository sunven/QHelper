import {
  jsonStringSettings,
  shouldCaptureJsonRequest,
  type JsonRequestLike,
} from '@/lib/fe-tools/json-string'
import {
  appendCapturedJsonStringRequest,
  clearCapturedJsonStringRequests,
} from '@/lib/fe-tools/json-string-request-store'

let jsonStringEnabled = false
let jsonStringPanelCreated = false

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

  void clearCapturedJsonStringRequests()
}

void clearCapturedJsonStringRequests()
void jsonStringSettings.get().then((settings) => {
  applyJsonStringSettings(settings.enabled)
})

jsonStringSettings.subscribe((settings) => {
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
    void appendCapturedJsonStringRequest({
      request: request.request,
      response: request.response,
      content,
    })
  })
})
