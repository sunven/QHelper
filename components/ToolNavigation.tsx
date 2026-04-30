import * as React from 'react';
import { TOOL_CATEGORIES } from '@/lib/navigation-config';
import { getCurrentToolKey, navigateToTool } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export function ToolNavigation() {
  const currentToolKey = getCurrentToolKey();
  const [openCategoryKey, setOpenCategoryKey] = React.useState<string | null>(null);
  const navRef = React.useRef<HTMLDivElement>(null);

  // 检查当前分类是否包含当前工具
  const isCurrentCategory = (categoryKey: string) => {
    const category = TOOL_CATEGORIES.find((cat) => cat.key === categoryKey);
    return category?.tools.some((tool) => tool.key === currentToolKey) || false;
  };

  React.useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenCategoryKey(null);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenCategoryKey(null);
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div ref={navRef} className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[24px] border border-white/70 bg-white/76 p-2 shadow-[0_20px_50px_rgba(15,23,42,0.10)] backdrop-blur dark:border-white/10 dark:bg-slate-950/72">
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden shrink-0 items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/72 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 md:flex">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div className="text-[11px] font-medium uppercase tracking-[0.24em]">Entrypoints</div>
          </div>

          <div className="relative min-w-0 flex-1" onMouseLeave={() => setOpenCategoryKey(null)}>
            <div className="flex flex-wrap justify-start gap-2">
              {TOOL_CATEGORIES.map((category) => {
                const isOpen = openCategoryKey === category.key;

                return (
                  <button
                    key={category.key}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`tool-category-panel-${category.key}`}
                    onClick={() => setOpenCategoryKey(isOpen ? null : category.key)}
                    className={cn(
                      'inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-transparent bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition-[color,box-shadow,border-color,background-color] hover:border-slate-200 hover:bg-white hover:text-slate-950 focus-visible:ring-[3px] focus-visible:ring-emerald-400/25 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/55 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-white',
                      (isOpen || isCurrentCategory(category.key)) &&
                        'border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
                    )}
                  >
                    <span>{category.name}</span>
                    <ChevronDown
                      aria-hidden="true"
                      data-testid={`tool-category-chevron-${category.key}`}
                      className={cn('h-3.5 w-3.5 transition-transform duration-200', isOpen && 'rotate-180')}
                    />
                  </button>
                );
              })}
            </div>

            {TOOL_CATEGORIES.map((category) => {
              if (openCategoryKey !== category.key) {
                return null;
              }

              return (
                <div
                  key={category.key}
                  id={`tool-category-panel-${category.key}`}
                  className="absolute left-0 top-full w-[min(820px,calc(100vw-2rem))] pt-2"
                >
                  <ul className="grid w-full auto-rows-fr gap-3 overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_22px_50px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-slate-950/90 md:grid-cols-2 xl:grid-cols-3">
                    {category.tools.map((tool) => {
                      const isActive = tool.key === currentToolKey;

                      return (
                        <li key={tool.key} className="flex">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setOpenCategoryKey(null);
                              navigateToTool(tool);
                            }}
                            className={cn(
                              'flex h-24 w-full select-none flex-col rounded-2xl border p-3.5 leading-none no-underline outline-none transition-[border-color,background-color,box-shadow,color] duration-200',
                              isActive
                                ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800 shadow-[0_12px_30px_rgba(16,185,129,0.12)] font-medium dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                                : 'border-slate-200/80 bg-white/76 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-950 focus:border-slate-300 focus:bg-white focus:text-slate-950 dark:border-slate-800 dark:bg-slate-900/56 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900',
                            )}
                          >
                            <div className="text-sm font-medium leading-none">{tool.name}</div>
                            {tool.description && (
                              <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">
                                {tool.description}
                              </p>
                            )}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
