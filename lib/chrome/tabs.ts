/**
 * Chrome Tabs API 封装
 */
export async function create(url: string): Promise<chrome.tabs.Tab> {
  return chrome.tabs.create({ url });
}

export async function query(
  queryInfo: chrome.tabs.QueryInfo,
): Promise<chrome.tabs.Tab[]> {
  return chrome.tabs.query(queryInfo);
}

export async function getCurrent(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await query({ active: true, currentWindow: true });
  return tab;
}
