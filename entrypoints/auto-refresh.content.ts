import { defineContentScript } from 'wxt/utils/define-content-script'
import { normalizePageUrl } from '@/lib/auto-refresh/url'
import type {
  AutoRefreshMessage,
  AutoRefreshResponse,
  AutoRefreshTabState,
  SessionRefresh,
} from '@/types/auto-refresh'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const AUTO_REFRESH_INSTALL_KEY = '__qhelperAutoRefreshContentCleanup'

type AutoRefreshInstallGlobal = typeof globalThis & {
  [AUTO_REFRESH_INSTALL_KEY]?: () => void
}

type IconElement = {
  tag: 'path' | 'rect'
  attrs: Record<string, string>
}

function createIcon(
  elements: readonly IconElement[],
  size: number,
): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg') as SVGSVGElement
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('width', String(size))
  svg.setAttribute('height', String(size))
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')

  for (const element of elements) {
    const node = document.createElementNS(SVG_NAMESPACE, element.tag)
    for (const [name, value] of Object.entries(element.attrs)) {
      node.setAttribute(name, value)
    }
    svg.append(node)
  }

  return svg
}

function createRefreshIcon(): SVGSVGElement {
  return createIcon(
    [
      { tag: 'path', attrs: { d: 'M21 12a9 9 0 1 1-2.64-6.36' } },
      { tag: 'path', attrs: { d: 'M21 3v6h-6' } },
    ],
    14,
  )
}

function createPauseIcon(): SVGSVGElement {
  return createIcon(
    [
      {
        tag: 'rect',
        attrs: { x: '6', y: '4', width: '4', height: '16', rx: '1' },
      },
      {
        tag: 'rect',
        attrs: { x: '14', y: '4', width: '4', height: '16', rx: '1' },
      },
    ],
    14,
  )
}

function createChevronIcon(): SVGSVGElement {
  return createIcon([{ tag: 'path', attrs: { d: 'm6 9 6 6 6-6' } }], 12)
}

const INDICATOR_STYLES = `
.pill {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 5px 7px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.94);
  color: #fff;
  font: 12px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  user-select: none;
}
button {
  appearance: none;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 999px;
}
button:hover { background: rgba(255, 255, 255, 0.12); }
button:focus-visible { outline: 2px solid #93c5fd; outline-offset: 1px; }
.countdown {
  min-width: 34px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.chevron { opacity: 0.75; }
[data-collapsed="true"] .countdown,
[data-collapsed="true"] .pause { display: none; }
[data-collapsed="true"] .chevron svg { transform: rotate(180deg); }
`

type ActiveSessionTimer = {
  intervalSeconds: number
  startedAt: number
  nextRefreshAt: number
  timerId: number | null
}

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  const hours = Math.floor(minutes / 60)
  const restMinutes = minutes % 60
  return `${hours}:${String(restMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

class AutoRefreshIndicator {
  private readonly host: HTMLElement
  private readonly pill: HTMLDivElement
  private readonly countdown: HTMLSpanElement
  private readonly tickerId: number
  private nextRefreshAt: number | undefined

  constructor(onPause: () => void, onOpenManager: () => void) {
    const host = document.createElement('qhelper-auto-refresh')
    host.setAttribute('data-qhelper-auto-refresh', '')
    host.style.position = 'fixed'
    host.style.right = '16px'
    host.style.bottom = '16px'
    host.style.zIndex = '2147483647'
    host.style.pointerEvents = 'auto'

    const shadow = host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = INDICATOR_STYLES

    const pill = document.createElement('div')
    pill.className = 'pill'
    pill.dataset.collapsed = 'false'

    const mainButton = document.createElement('button')
    mainButton.type = 'button'
    mainButton.title = '打开自动刷新管理'
    mainButton.setAttribute('aria-label', '打开自动刷新管理')
    const countdown = document.createElement('span')
    countdown.className = 'countdown'
    countdown.textContent = '自动刷新'
    mainButton.append(createRefreshIcon(), countdown)
    mainButton.addEventListener('click', onOpenManager)

    const pauseButton = document.createElement('button')
    pauseButton.type = 'button'
    pauseButton.className = 'pause'
    pauseButton.title = '暂停此标签页'
    pauseButton.setAttribute('aria-label', '暂停此标签页')
    pauseButton.append(createPauseIcon())
    pauseButton.addEventListener('click', onPause)

    const collapseButton = document.createElement('button')
    collapseButton.type = 'button'
    collapseButton.className = 'chevron'
    collapseButton.title = '折叠自动刷新浮标'
    collapseButton.setAttribute('aria-label', '折叠自动刷新浮标')
    collapseButton.append(createChevronIcon())
    collapseButton.addEventListener('click', () => {
      const collapsed = pill.dataset.collapsed === 'true'
      pill.dataset.collapsed = collapsed ? 'false' : 'true'
      collapseButton.title = collapsed ? '折叠自动刷新浮标' : '展开自动刷新浮标'
      collapseButton.setAttribute(
        'aria-label',
        collapsed ? '折叠自动刷新浮标' : '展开自动刷新浮标',
      )
    })

    pill.append(mainButton, pauseButton, collapseButton)
    shadow.append(style, pill)
    document.documentElement.append(host)

    this.host = host
    this.pill = pill
    this.countdown = countdown
    this.nextRefreshAt = undefined
    this.tickerId = window.setInterval(() => this.render(), 1000)
    this.render()
  }

  setNextRefreshAt(value: number | undefined): void {
    this.nextRefreshAt = value
    this.render()
  }

  destroy(): void {
    window.clearInterval(this.tickerId)
    this.host.remove()
  }

  private render(): void {
    if (!this.pill.isConnected) {
      return
    }

    if (!this.nextRefreshAt) {
      this.countdown.textContent = '自动刷新'
      return
    }

    const remaining = Math.max(0, this.nextRefreshAt - Date.now())
    const seconds = Math.ceil(remaining / 1000)
    this.countdown.textContent =
      seconds > 0 ? formatCountdown(seconds) : '即将刷新'
  }
}

function installAutoRefreshContent(): void {
  const installState = globalThis as AutoRefreshInstallGlobal
  if (installState[AUTO_REFRESH_INSTALL_KEY]) {
    return
  }

  document.querySelectorAll('qhelper-auto-refresh').forEach((element) => {
    element.remove()
  })

  let indicator: AutoRefreshIndicator | null = null
  let sessionTimer: ActiveSessionTimer | null = null
  let lastUrl = normalizePageUrl(location.href)
  let disposed = false
  let urlPollId = 0

  const stopSessionTimer = () => {
    if (sessionTimer?.timerId != null) {
      window.clearTimeout(sessionTimer.timerId)
    }
    sessionTimer = null
  }

  const destroyIndicator = () => {
    indicator?.destroy()
    indicator = null
  }

  const cleanup = () => {
    if (disposed) {
      return
    }
    disposed = true
    stopSessionTimer()
    destroyIndicator()
    window.clearInterval(urlPollId)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pageshow', handlePageShow)
    if (installState[AUTO_REFRESH_INSTALL_KEY] === cleanup) {
      delete installState[AUTO_REFRESH_INSTALL_KEY]
    }
  }

  const sendRuntimeMessage = async <T>(
    message: AutoRefreshMessage,
  ): Promise<AutoRefreshResponse<T> | undefined> => {
    if (disposed) {
      return undefined
    }

    try {
      return (await chrome.runtime.sendMessage(message)) as
        | AutoRefreshResponse<T>
        | undefined
    } catch {
      cleanup()
      return undefined
    }
  }

  const ensureIndicator = (): AutoRefreshIndicator => {
    if (!indicator) {
      indicator = new AutoRefreshIndicator(
        () => {
          void sendRuntimeMessage({ type: 'AUTO_REFRESH_PAUSE_SELF' })
        },
        () => {
          void sendRuntimeMessage({ type: 'AUTO_REFRESH_OPEN_MANAGER_SELF' })
        },
      )
    }
    return indicator
  }

  const applyState = (state: AutoRefreshTabState) => {
    if (state.effective === 'none') {
      stopSessionTimer()
      destroyIndicator()
      return
    }

    ensureIndicator()

    if (state.effective === 'rule') {
      stopSessionTimer()
      indicator?.setNextRefreshAt(state.nextRefreshAt)
      return
    }

    const session = state.session
    if (!session) {
      stopSessionTimer()
      destroyIndicator()
      return
    }

    if (
      sessionTimer &&
      sessionTimer.startedAt === session.startedAt &&
      sessionTimer.intervalSeconds === session.intervalSeconds
    ) {
      indicator?.setNextRefreshAt(sessionTimer.nextRefreshAt)
      if (sessionTimer.timerId === null) {
        scheduleSessionTick(sessionTimer)
      }
      return
    }

    startSessionTimer(session)
  }

  const requestState = async () => {
    const response = await sendRuntimeMessage<AutoRefreshTabState>({
      type: 'AUTO_REFRESH_CONTENT_READY',
    })
    if (response?.ok) {
      applyState(response.data)
    }
  }

  const scheduleSessionTick = (timer: ActiveSessionTimer) => {
    if (sessionTimer !== timer || disposed) {
      return
    }

    if (timer.timerId != null) {
      window.clearTimeout(timer.timerId)
    }
    timer.nextRefreshAt = Date.now() + timer.intervalSeconds * 1000
    indicator?.setNextRefreshAt(timer.nextRefreshAt)
    timer.timerId = window.setTimeout(() => {
      void runSessionTick(timer)
    }, timer.intervalSeconds * 1000)
  }

  const runSessionTick = async (timer: ActiveSessionTimer) => {
    timer.timerId = null
    if (sessionTimer !== timer || disposed) {
      return
    }

    const response = await sendRuntimeMessage<{
      reloaded: boolean
      active: boolean
    }>({ type: 'AUTO_REFRESH_SESSION_TICK' })

    if (sessionTimer !== timer || disposed) {
      return
    }

    if (!response?.ok) {
      scheduleSessionTick(timer)
      return
    }

    if (!response.data.active) {
      void requestState()
      return
    }

    if (!response.data.reloaded && timer.timerId === null) {
      scheduleSessionTick(timer)
    }
  }

  const startSessionTimer = (session: SessionRefresh) => {
    stopSessionTimer()
    const timer: ActiveSessionTimer = {
      intervalSeconds: session.intervalSeconds,
      startedAt: session.startedAt,
      nextRefreshAt: Date.now() + session.intervalSeconds * 1000,
      timerId: null,
    }
    sessionTimer = timer
    indicator?.setNextRefreshAt(timer.nextRefreshAt)
    scheduleSessionTick(timer)
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void requestState()
    }
  }

  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      void requestState()
    }
  }

  if (!chrome.runtime?.onMessage) {
    return
  }

  chrome.runtime.onMessage.addListener((message: unknown, _, sendResponse) => {
    const typed = message as AutoRefreshMessage | undefined

    if (typed?.type === 'AUTO_REFRESH_STATE_CHANGED') {
      applyState(typed.state)
      return false
    }

    if (typed?.type === 'AUTO_REFRESH_PING') {
      sendResponse({ ok: true, data: true })
      return false
    }

    return false
  })

  urlPollId = window.setInterval(() => {
    const currentUrl = normalizePageUrl(location.href)
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl
      void requestState()
    }
  }, 1000)

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('pageshow', handlePageShow)
  installState[AUTO_REFRESH_INSTALL_KEY] = cleanup
  void requestState()
}

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_idle',
  main() {
    installAutoRefreshContent()
  },
})
