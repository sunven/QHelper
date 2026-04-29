const SCRIPT_SRC_PATTERN = /src=['"](.*)['"]/i

export type TextFetcher = (url: string) => Promise<string>

export function parseMergeInput(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (!line.startsWith('<script')) {
        return line
      }

      const result = line.match(SCRIPT_SRC_PATTERN)
      return result ? result[1] : line
    })
    .filter(Boolean)
}

export async function fetchRemoteText(url: string): Promise<string> {
  const response = await fetch(url)
  return response.text()
}

export async function mergeRemoteText(urls: string[], fetcher: TextFetcher = fetchRemoteText): Promise<string> {
  const values = await Promise.all(urls.map((url) => fetcher(url)))
  return values.reduce((previous, current) => previous + current + '\n', '').trimEnd()
}

export async function mergeInputText(input: string, fetcher: TextFetcher = fetchRemoteText): Promise<string> {
  return mergeRemoteText(parseMergeInput(input), fetcher)
}

export function buildDownloadFileName(now = Date.now()): string {
  return `${now}.js`
}
