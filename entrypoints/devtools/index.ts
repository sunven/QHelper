import {
  REQUEST_DATA_STORAGE_KEY,
  shouldCaptureJsonRequest,
  type JsonRequestLike,
} from '@/lib/legacy-fe-tools/json-string'

type CapturedRequest = {
  request: chrome.devtools.network.Request['request']
  response: chrome.devtools.network.Request['response']
  content: string
}

async function getCapturedRequests(): Promise<CapturedRequest[]> {
  const result = await chrome.storage.local.get(REQUEST_DATA_STORAGE_KEY)
  return (result[REQUEST_DATA_STORAGE_KEY] as CapturedRequest[] | undefined) ?? []
}

void chrome.storage.local.set({ [REQUEST_DATA_STORAGE_KEY]: [] })

chrome.devtools.panels.create('Json String', '', 'json-string-panel.html')

chrome.devtools.network.onRequestFinished.addListener((request) => {
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
