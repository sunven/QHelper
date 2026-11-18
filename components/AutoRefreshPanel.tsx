import { IntervalInput } from '@/components/auto-refresh/IntervalInput'
import { Button } from '@/components/ui/button'
import { sendAutoRefreshMessage } from '@/lib/auto-refresh/client'
import { formatIntervalSeconds } from '@/lib/auto-refresh/url'
import { getErrorMessage } from '@/lib/utils'
import type { AutoRefreshTabState } from '@/types/auto-refresh'
import {
  AUTO_REFRESH_DEFAULT_SESSION_SECONDS,
  AUTO_REFRESH_MAX_SECONDS,
  AUTO_REFRESH_SESSION_MIN_SECONDS,
  AUTO_REFRESH_SESSION_PRESETS,
} from '@/types/auto-refresh'
import {
  ArrowsClockwiseIcon,
  GearSixIcon,
  PauseIcon,
  PlayIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react'
import { useCallback, useEffect, useState } from 'react'

export function AutoRefreshPanel() {
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null)
  const [state, setState] = useState<AutoRefreshTabState | null>(null)
  const [sessionInterval, setSessionInterval] = useState(
    AUTO_REFRESH_DEFAULT_SESSION_SECONDS,
  )
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      setTab(activeTab ?? null)

      if (!activeTab?.id) {
        setState(null)
        return
      }

      const nextState = await sendAutoRefreshMessage<AutoRefreshTabState>({
        type: 'AUTO_REFRESH_GET_TAB_STATE',
        tabId: activeTab.id,
      })
      setState(nextState)
      if (nextState.session) {
        setSessionInterval(nextState.session.intervalSeconds)
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const runAction = async (action: () => Promise<AutoRefreshTabState>) => {
    setBusy(true)
    setError('')

    try {
      const nextState = await action()
      setState(nextState)
      if (nextState.session) {
        setSessionInterval(nextState.session.intervalSeconds)
      }
    } catch (actionError) {
      setError(getErrorMessage(actionError))
    } finally {
      setBusy(false)
    }
  }

  const startSession = () => {
    if (!tab?.id) {
      return
    }
    const tabId = tab.id
    void runAction(() =>
      sendAutoRefreshMessage<AutoRefreshTabState>({
        type: 'AUTO_REFRESH_START_SESSION',
        tabId,
        intervalSeconds: sessionInterval,
      }),
    )
  }

  const stopSession = () => {
    if (!tab?.id) {
      return
    }
    const tabId = tab.id
    void runAction(() =>
      sendAutoRefreshMessage<AutoRefreshTabState>({
        type: 'AUTO_REFRESH_STOP_SESSION',
        tabId,
      }),
    )
  }

  const pauseTab = () => {
    if (!tab?.id) {
      return
    }
    const tabId = tab.id
    void runAction(() =>
      sendAutoRefreshMessage<AutoRefreshTabState>({
        type: 'AUTO_REFRESH_PAUSE_TAB',
        tabId,
      }),
    )
  }

  const resumeTab = () => {
    if (!tab?.id) {
      return
    }
    const tabId = tab.id
    void runAction(() =>
      sendAutoRefreshMessage<AutoRefreshTabState>({
        type: 'AUTO_REFRESH_RESUME_TAB',
        tabId,
      }),
    )
  }

  const openManager = () => {
    void sendAutoRefreshMessage({
      type: 'AUTO_REFRESH_OPEN_MANAGER',
      url: tab?.url,
    }).catch((openError) => {
      setError(getErrorMessage(openError))
    })
  }

  const supported = state?.supported ?? false
  const statusLabel = loading
    ? '读取中…'
    : !supported
      ? '此页面不支持'
      : !state?.masterEnabled
        ? '已全局关闭'
        : state.paused
          ? '已暂停'
          : state.effective === 'session'
            ? '临时刷新中'
            : state.effective === 'rule'
              ? '持久规则生效'
              : '未设置'

  return (
    <section
      data-testid="auto-refresh-panel"
      className="flex flex-col gap-1.5 border border-border/70 bg-card/60 px-2 py-1.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
            <ArrowsClockwiseIcon aria-hidden weight="duotone" />
          </span>
          <span className="shrink-0 text-xs font-medium">自动刷新</span>
          <span className="truncate text-xs text-muted-foreground">
            {statusLabel}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="打开自动刷新管理"
          title="管理自动刷新规则"
          onClick={openManager}
          className="rounded-sm"
        >
          <GearSixIcon aria-hidden weight="duotone" />
        </Button>
      </div>

      {!loading && state && state.supported && !state.masterEnabled && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            自动刷新已全局关闭，规则和临时刷新都不会执行。
          </span>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={openManager}
          >
            打开管理页
          </Button>
        </div>
      )}

      {!loading && state && state.masterEnabled && state.paused && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">
            此标签页已暂停，恢复后继续执行当前规则。
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              size="xs"
              disabled={busy}
              onClick={resumeTab}
              data-testid="auto-refresh-resume-tab"
            >
              <PlayIcon aria-hidden weight="duotone" />
              恢复刷新
            </Button>
            {state.session && (
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={busy}
                onClick={stopSession}
              >
                停止临时刷新
              </Button>
            )}
          </div>
        </div>
      )}

      {!loading &&
        state &&
        state.masterEnabled &&
        !state.paused &&
        state.effective === 'session' &&
        state.session && (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span>
                临时刷新 · 每{' '}
                {formatIntervalSeconds(state.session.intervalSeconds)}
              </span>
              {state.rule && (
                <span className="text-muted-foreground">
                  覆盖持久规则（每{' '}
                  {formatIntervalSeconds(state.rule.intervalSeconds)}）
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={busy}
                onClick={stopSession}
                data-testid="auto-refresh-stop-session"
              >
                停止临时刷新
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={busy}
                onClick={pauseTab}
                data-testid="auto-refresh-pause-tab"
              >
                <PauseIcon aria-hidden weight="duotone" />
                暂停此标签页
              </Button>
            </div>
          </div>
        )}

      {!loading &&
        state &&
        state.masterEnabled &&
        !state.paused &&
        state.effective === 'rule' &&
        state.rule && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs">
              持久规则 · 每 {formatIntervalSeconds(state.rule.intervalSeconds)}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={busy}
                onClick={pauseTab}
                data-testid="auto-refresh-pause-tab"
              >
                <PauseIcon aria-hidden weight="duotone" />
                暂停此标签页
              </Button>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={openManager}
              >
                管理规则
              </Button>
            </div>
          </div>
        )}

      {!loading &&
        state &&
        state.masterEnabled &&
        !state.paused &&
        state.effective === 'none' &&
        supported && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              为当前页面启动临时刷新，关闭标签页后自动结束。
            </span>
            <IntervalInput
              compact
              valueSeconds={sessionInterval}
              onChange={setSessionInterval}
              presets={AUTO_REFRESH_SESSION_PRESETS}
              minSeconds={AUTO_REFRESH_SESSION_MIN_SECONDS}
              maxSeconds={AUTO_REFRESH_MAX_SECONDS}
              disabled={busy}
            />
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                size="xs"
                disabled={busy}
                onClick={startSession}
                data-testid="auto-refresh-start-session"
              >
                {busy ? (
                  <SpinnerGapIcon className="animate-spin" aria-hidden />
                ) : (
                  <PlayIcon aria-hidden weight="duotone" />
                )}
                开始临时刷新
              </Button>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={openManager}
              >
                设置持久规则
              </Button>
            </div>
          </div>
        )}

      {!loading && !supported && (
        <span className="text-xs text-muted-foreground">
          仅支持 http(s) 网页；本地页面和浏览器内部页面无法自动刷新。
        </span>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </section>
  )
}
