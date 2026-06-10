export interface RepositoryPageHelperAdapter {
  render: (pathname: string) => boolean;
  shouldRetry: (pathname: string) => boolean;
  shouldRecoverFromMutation: (pathname: string) => boolean;
  onInstall?: () => void;
}

interface RepositoryPageHelperInstallOptions {
  retryDelayMs?: number;
}

export function installRepositoryPageHelper(
  win: Window,
  doc: Document,
  helper: RepositoryPageHelperAdapter,
  options: RepositoryPageHelperInstallOptions = {},
): void {
  installRepositoryPageHelpers(win, doc, [helper], options);
}

export function installRepositoryPageHelpers(
  win: Window,
  doc: Document,
  helpers: RepositoryPageHelperAdapter[],
  options: RepositoryPageHelperInstallOptions = {},
): void {
  const retryDelayMs = options.retryDelayMs ?? 250;
  let lastPathname = win.location.pathname;
  let retryTimer: number | undefined;
  const pendingRetryHelpers = new Set<RepositoryPageHelperAdapter>();

  const cancelRetry = () => {
    if (retryTimer !== undefined) {
      win.clearTimeout(retryTimer);
      retryTimer = undefined;
    }
    pendingRetryHelpers.clear();
  };

  const runPendingRetry = () => {
    if (retryTimer !== undefined) {
      win.clearTimeout(retryTimer);
      retryTimer = undefined;
    }

    const helpersToRender = [...pendingRetryHelpers];
    pendingRetryHelpers.clear();
    renderWithRetry(helpersToRender);
  };

  const scheduleRetry = (helpersToRetry: RepositoryPageHelperAdapter[]) => {
    helpersToRetry.forEach((helper) => pendingRetryHelpers.add(helper));

    if (pendingRetryHelpers.size > 0 && retryTimer === undefined) {
      retryTimer = win.setTimeout(runPendingRetry, retryDelayMs);
    }
  };

  const renderWithRetry = (helpersToRender: RepositoryPageHelperAdapter[]) => {
    const pathname = win.location.pathname;
    const results = helpersToRender.map((helper) => ({
      helper,
      rendered: helper.render(pathname),
    }));
    const retryHelpers = results
      .filter(({ helper, rendered }) => helper.shouldRetry(pathname) && !rendered)
      .map(({ helper }) => helper);

    results.forEach(({ helper }) => {
      if (!retryHelpers.includes(helper)) {
        pendingRetryHelpers.delete(helper);
      }
    });

    if (pendingRetryHelpers.size === 0 && retryTimer !== undefined) {
      win.clearTimeout(retryTimer);
      retryTimer = undefined;
    }

    scheduleRetry(retryHelpers);
  };

  const attemptRender = (helpersToRender = helpers) => {
    cancelRetry();
    renderWithRetry(helpersToRender);
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
      helper.shouldRecoverFromMutation(pathname),
    );
    if (recoveryHelpers.length > 0) {
      renderWithRetry(recoveryHelpers);
    }
  };

  attemptRender();

  doc.addEventListener('turbo:load', rerenderIfPathChanged as EventListener);
  doc.addEventListener('pjax:end', rerenderIfPathChanged as EventListener);
  win.addEventListener('popstate', rerenderIfPathChanged);
  helpers.forEach((helper) => helper.onInstall?.());

  const observer = new MutationObserver(() => {
    if (!rerenderIfPathChanged()) {
      recoverFromMutation();
    }
  });

  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
  });
}
