/**
 * Chrome Cookies API 封装
 */
export async function getAll(
  details?: chrome.cookies.GetAllDetails | undefined,
): Promise<chrome.cookies.Cookie[]> {
  return await chrome.cookies.getAll(details ?? {});
}

export async function remove(
  details: { name: string; url: string },
): Promise<chrome.cookies.CookieDetails | null> {
  return await chrome.cookies.remove(details);
}

function getCookieRemovalUrl(cookie: chrome.cookies.Cookie): string {
  const protocol = cookie.secure ? 'https' : 'http';
  const domain = cookie.domain.replace(/^\./, '');
  const path = cookie.path
    ? cookie.path.startsWith('/')
      ? cookie.path
      : `/${cookie.path}`
    : '/';

  return `${protocol}://${domain}${path}`;
}

export async function removeAll(): Promise<void> {
  const cookies = await getAll();
  for (const cookie of cookies) {
    await remove({ name: cookie.name, url: getCookieRemovalUrl(cookie) });
  }
}
