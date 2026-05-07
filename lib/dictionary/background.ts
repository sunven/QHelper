import {
  DICTIONARY_FETCH_MESSAGE,
  type DictionaryFetchMessage,
} from './types'

export type DictionaryBackgroundDeps = {
  fetchText: (url: string) => Promise<string>
}

const defaultDeps: DictionaryBackgroundDeps = {
  fetchText: async (url: string) => {
    const response = await fetch(url)
    return response.text()
  },
}

export function isDictionaryFetchMessage(
  message: unknown,
): message is DictionaryFetchMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as DictionaryFetchMessage).type === DICTIONARY_FETCH_MESSAGE &&
    typeof (message as DictionaryFetchMessage).url === 'string'
  )
}

export function handleDictionaryFetchMessage(
  message: unknown,
  sendResponse: (value: string) => void,
  deps: DictionaryBackgroundDeps = defaultDeps,
) {
  if (!isDictionaryFetchMessage(message)) {
    return false
  }

  void deps.fetchText(message.url).then(sendResponse).catch(() => {
    sendResponse('')
  })
  return true
}
