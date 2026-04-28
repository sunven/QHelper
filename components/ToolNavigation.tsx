import * as React from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { TOOL_CATEGORIES } from '@/lib/navigation-config';
import { getCurrentToolKey, navigateToTool } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

export function ToolNavigation() {
  const currentToolKey = getCurrentToolKey();

  // 检查当前分类是否包含当前工具
  const isCurrentCategory = (categoryKey: string) => {
    const category = TOOL_CATEGORIES.find((cat) => cat.key === categoryKey);
    return category?.tools.some((tool) => tool.key === currentToolKey) || false;
  };

  return (
    <div className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[24px] border border-white/70 bg-white/76 p-2 shadow-[0_20px_50px_rgba(15,23,42,0.10)] backdrop-blur dark:border-white/10 dark:bg-slate-950/72">
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden shrink-0 items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/72 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 md:flex">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div className="text-[11px] font-medium uppercase tracking-[0.24em]">Entrypoints</div>
          </div>

          <div className="min-w-0 flex-1">
            <NavigationMenu className="flex-none w-fit max-w-full justify-start">
              <NavigationMenuList className="flex-wrap justify-start gap-2">
                {TOOL_CATEGORIES.map((category) => (
                  <NavigationMenuItem key={category.key}>
                    <NavigationMenuTrigger
                      className={cn(
                        isCurrentCategory(category.key) &&
                          'border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
                      )}
                    >
                      {category.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-full gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                        {category.tools.map((tool) => {
                          const isActive = tool.key === currentToolKey;

                          return (
                            <li key={tool.key}>
                              <NavigationMenuLink asChild>
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigateToTool(tool);
                                  }}
                                  className={cn(
                                    'block select-none space-y-1 rounded-2xl border p-3.5 leading-none no-underline outline-none transition-[border-color,background-color,box-shadow,color] duration-200',
                                    isActive
                                      ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800 shadow-[0_12px_30px_rgba(16,185,129,0.12)] font-medium dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                                      : 'border-slate-200/80 bg-white/76 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-950 focus:border-slate-300 focus:bg-white focus:text-slate-950 dark:border-slate-800 dark:bg-slate-900/56 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900',
                                  )}
                                >
                                  <div className="text-sm font-medium leading-none">
                                    {tool.name}
                                  </div>
                                  {tool.description && (
                                    <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                                      {tool.description}
                                    </p>
                                  )}
                                </a>
                              </NavigationMenuLink>
                            </li>
                          );
                        })}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
