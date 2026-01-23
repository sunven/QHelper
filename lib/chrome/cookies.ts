/**
 * Chrome Cookies API 封装
 */
export async function getAll(
  details?: chrome.cookies.GetAllDetails,
): Promise<chrome.cookies.Cookie[]> {
  return chrome.cookies.getAll(details);
}

export async function remove(
  details: chrome.cookies.RemoveDetails,
): Promise<chrome.cookies.Cookie | null> {
  return chrome.cookies.remove(details);
}

export async function removeAll(): Promise<void> {
  const cookies = await getAll();
  for (const cookie of cookies) {
    await remove({ name: cookie.name, url: `https://${cookie.domain}` });
  }
}
