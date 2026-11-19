/**
 * Chrome Scripting API 封装
 */

export async function executeScriptInTab<Args extends unknown[], Result>(
  tabId: number,
  func: (...args: Args) => Result,
  args?: Args,
): Promise<Result | undefined> {
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId },
    func,
    args,
  })

  return injection?.result as Result | undefined
}
