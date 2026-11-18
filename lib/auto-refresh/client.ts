import { getErrorMessage } from '@/lib/utils'
import type {
  AutoRefreshMessage,
  AutoRefreshResponse,
} from '@/types/auto-refresh'

export async function sendAutoRefreshMessage<T>(
  message: AutoRefreshMessage,
): Promise<T> {
  let response: AutoRefreshResponse<T> | undefined

  try {
    response = (await chrome.runtime.sendMessage(message)) as
      | AutoRefreshResponse<T>
      | undefined
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }

  if (!response) {
    throw new Error('自动刷新服务未响应')
  }

  if (!response.ok) {
    throw new Error(response.error)
  }

  return response.data
}
