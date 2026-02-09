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
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-center">
        <NavigationMenu>
          <NavigationMenuList>
            {TOOL_CATEGORIES.map((category) => (
              <NavigationMenuItem key={category.key}>
                <NavigationMenuTrigger
                  className={cn(
                    isCurrentCategory(category.key) &&
                      'bg-accent text-accent-foreground font-medium',
                  )}
                >
                  {category.name}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
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
                                'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
                                isActive
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm font-medium dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                                  : 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                              )}
                            >
                              <div className="text-sm font-medium leading-none">
                                {tool.name}
                              </div>
                              {tool.description && (
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
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
  );
}
