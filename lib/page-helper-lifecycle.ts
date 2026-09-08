export interface PageHelperAdapter {
  render: (pathname: string) => boolean;
  /** 当前页面值得重试渲染（默认 false：不重试） */
  shouldRetry?: (pathname: string) => boolean;
  /** 同路径 DOM 变更后需要恢复渲染（默认 false：不恢复） */
  shouldRecoverFromMutation?: (pathname: string) => boolean;
  onInstall?: () => void;
}

/** 站点的 SPA 导航模型：哪些事件可能改变路径 */
export interface PageHelperSiteProfile {
  /** 监听在 document 上的导航事件（如 turbo:load、pjax:end） */
  documentEvents?: string[];
  /** 监听在 window 上的导航事件（如 popstate） */
  windowEvents?: string[];
}

export interface PageHelperInstallOptions {
  retryDelayMs?: number;
  /** 单条重试链的最大渲染尝试次数（默认 20；导航或变更恢复会开启新链） */
  maxAttempts?: number;
}

const DEFAULT_RETRY_DELAY_MS = 250;
const DEFAULT_MAX_ATTEMPTS = 20;

/**
 * Page Helper Lifecycle：页面助手的共享安装循环。
 * 拥有路径变化检测、变更恢复、带预算的定时重试与卸载；
 * 每个助手只声明 render 与（可选的）重试/恢复决策。
 * 站点的导航事件由调用方通过 site profile 声明。
 */
export function installPageHelpers(
  win: Window,
  doc: Document,
  profile: PageHelperSiteProfile,
  helpers: PageHelperAdapter[],
  options: PageHelperInstallOptions = {},
): () => void {
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  let lastPathname = win.location.pathname;
  let retryTimer: number | undefined;
  let disposed = false;
  const pendingRetryHelpers = new Set<PageHelperAdapter>();
  const attemptCounts = new Map<PageHelperAdapter, number>();

  const cancelRetry = () => {
    if (retryTimer !== undefined) {
      win.clearTimeout(retryTimer);
      retryTimer = undefined;
    }
    pendingRetryHelpers.clear();
  };

  const runPendingRetry = () => {
    if (disposed) {
      return;
    }

    if (retryTimer !== undefined) {
      win.clearTimeout(retryTimer);
      retryTimer = undefined;
    }

    const helpersToRender = [...pendingRetryHelpers];
    pendingRetryHelpers.clear();
    renderBatch(helpersToRender, false);
  };

  const scheduleRetry = (helpersToRetry: PageHelperAdapter[]) => {
    for (const helper of helpersToRetry) {
      pendingRetryHelpers.add(helper);
    }

    if (pendingRetryHelpers.size > 0 && retryTimer === undefined) {
      retryTimer = win.setTimeout(runPendingRetry, retryDelayMs);
    }
  };

  const renderBatch = (
    helpersToRender: PageHelperAdapter[],
    eventDriven: boolean,
  ) => {
    const pathname = win.location.pathname;
    const retryHelpers: PageHelperAdapter[] = [];

    for (const helper of helpersToRender) {
      // 事件驱动（导航/恢复）开启新的重试链，预算重置
      if (eventDriven) {
        attemptCounts.set(helper, 0);
      }

      const rendered = helper.render(pathname);
      const attempts = (attemptCounts.get(helper) ?? 0) + 1;
      attemptCounts.set(helper, attempts);

      if (!rendered && helper.shouldRetry?.(pathname) && attempts < maxAttempts) {
        retryHelpers.push(helper);
      } else {
        pendingRetryHelpers.delete(helper);
      }
    }

    if (pendingRetryHelpers.size === 0 && retryTimer !== undefined) {
      win.clearTimeout(retryTimer);
      retryTimer = undefined;
    }

    scheduleRetry(retryHelpers);
  };

  const attemptRender = (helpersToRender = helpers) => {
    cancelRetry();
    renderBatch(helpersToRender, true);
  };

  const rerenderIfPathChanged = (): boolean => {
    if (win.location.pathname === lastPathname) {
      return false;
    }

    lastPathname = win.location.pathname;
    attemptRender();
    return true;
  };

  const recoverFromMutation = () => {
    const pathname = win.location.pathname;
    const recoveryHelpers = helpers.filter((helper) =>
      helper.shouldRecoverFromMutation?.(pathname),
    );
    if (recoveryHelpers.length > 0) {
      renderBatch(recoveryHelpers, true);
    }
  };

  attemptRender();

  const handleNavigation = rerenderIfPathChanged as EventListener;
  profile.documentEvents?.forEach((type) => {
    doc.addEventListener(type, handleNavigation);
  });
  profile.windowEvents?.forEach((type) => {
    win.addEventListener(type, handleNavigation);
  });
  for (const helper of helpers) {
    helper.onInstall?.();
  }

  const observer = new MutationObserver(() => {
    if (disposed) {
      return;
    }

    if (!rerenderIfPathChanged()) {
      recoverFromMutation();
    }
  });

  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
  });

  return () => {
    disposed = true;
    profile.documentEvents?.forEach((type) => {
      doc.removeEventListener(type, handleNavigation);
    });
    profile.windowEvents?.forEach((type) => {
      win.removeEventListener(type, handleNavigation);
    });
    observer.disconnect();
    cancelRetry();
  };
}
