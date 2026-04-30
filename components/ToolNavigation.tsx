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
    <div ref={navRef} className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/88 px-2 py-1.5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/86 sm:px-3 lg:px-4">
      <div className="mx-auto max-w-[1520px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="hidden shrink-0 items-center gap-1.5 rounded-md border border-slate-200/80 bg-slate-50 px-2 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 md:flex">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div className="text-[10px] font-medium uppercase">Tools</div>
          </div>

          <div className="relative min-w-0 flex-1" onMouseLeave={() => setOpenCategoryKey(null)}>
            <div className="flex flex-wrap justify-start gap-1">
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
                      'inline-flex h-8 items-center justify-center gap-1 rounded-md border border-transparent bg-white/62 px-2.5 py-1 text-[13px] font-medium text-slate-700 outline-none transition-[color,box-shadow,border-color,background-color] hover:border-slate-200 hover:bg-white hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-emerald-400/25 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/55 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-white',
                      (isOpen || isCurrentCategory(category.key)) &&
                        'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
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
                  className="absolute left-0 top-full w-[min(760px,calc(100vw-1rem))] pt-1.5"
                >
                  <ul className="grid w-full auto-rows-fr gap-1.5 overflow-hidden rounded-md border border-slate-200/80 bg-white/96 p-2 shadow-md backdrop-blur dark:border-slate-800 dark:bg-slate-950/96 md:grid-cols-2 xl:grid-cols-3">
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
                              'flex min-h-14 w-full select-none flex-col rounded-md border p-2 leading-none no-underline outline-none transition-[border-color,background-color,box-shadow,color] duration-200',
                              isActive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 font-medium dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                                : 'border-slate-200/80 bg-white/76 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-950 focus:border-slate-300 focus:bg-white focus:text-slate-950 dark:border-slate-800 dark:bg-slate-900/56 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900',
                            )}
                          >
                            <div className="text-[13px] font-medium leading-4">{tool.name}</div>
                            {tool.description && (
                              <p className="mt-1 line-clamp-1 text-xs leading-4 text-muted-foreground">
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
