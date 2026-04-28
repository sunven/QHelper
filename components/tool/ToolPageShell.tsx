import { TOOL_CATEGORIES } from '@/constants/tools';
import { toolRegistry } from '@/lib/registry/ToolRegistry';
import { ToolFeature, type ToolCategory } from '@/lib/registry/ToolMetadata';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  Calculator,
  CalendarClock,
  Clock,
  Code,
  Code2,
  FileCode,
  FileJson,
  FileText,
  Hash,
  Image,
  ImagePlus,
  Key,
  Link2,
  Palette,
  Shield,
  Wand2,
  Wrench,
  Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { ToolNavigation } from '@/components/ToolNavigation';

const iconMap: Record<string, LucideIcon> = {
  Calculator,
  CalendarClock,
  Clock,
  Code,
  Code2,
  FileCode,
  FileJson,
  FileText,
  Hash,
  Image,
  ImagePlus,
  Key,
  Link2,
  Palette,
  Shield,
  Wand2,
  Zap,
};

const categoryThemeMap: Record<
  ToolCategory,
  {
    accentGlow: string;
    accentText: string;
    badge: string;
    chip: string;
    iconBox: string;
    statGlow: string;
  }
> = {
  common: {
    accentGlow:
      'bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.18),transparent_26%)]',
    accentText: 'text-sky-700 dark:text-sky-300',
    badge:
      'border-sky-200/80 bg-sky-50/85 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200',
    chip:
      'border-sky-200/70 bg-white/80 text-sky-700 dark:border-sky-500/25 dark:bg-slate-900/60 dark:text-sky-200',
    iconBox:
      'border-sky-200/80 bg-[linear-gradient(145deg,rgba(224,242,254,0.95),rgba(240,253,250,0.9))] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
    statGlow: 'from-sky-500/12 via-cyan-500/8 to-transparent',
  },
  encoding: {
    accentGlow:
      'bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.16),transparent_26%)]',
    accentText: 'text-amber-700 dark:text-amber-300',
    badge:
      'border-amber-200/80 bg-amber-50/85 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200',
    chip:
      'border-amber-200/70 bg-white/80 text-amber-700 dark:border-amber-500/25 dark:bg-slate-900/60 dark:text-amber-200',
    iconBox:
      'border-amber-200/80 bg-[linear-gradient(145deg,rgba(255,247,237,0.96),rgba(236,253,245,0.88))] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
    statGlow: 'from-amber-500/12 via-emerald-500/8 to-transparent',
  },
  image: {
    accentGlow:
      'bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.16),transparent_30%)]',
    accentText: 'text-blue-700 dark:text-blue-300',
    badge:
      'border-blue-200/80 bg-blue-50/85 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200',
    chip:
      'border-blue-200/70 bg-white/80 text-blue-700 dark:border-blue-500/25 dark:bg-slate-900/60 dark:text-blue-200',
    iconBox:
      'border-blue-200/80 bg-[linear-gradient(145deg,rgba(239,246,255,0.96),rgba(236,253,245,0.88))] text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
    statGlow: 'from-blue-500/12 via-emerald-500/8 to-transparent',
  },
  security: {
    accentGlow:
      'bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.16),transparent_28%)]',
    accentText: 'text-emerald-700 dark:text-emerald-300',
    badge:
      'border-emerald-200/80 bg-emerald-50/85 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200',
    chip:
      'border-emerald-200/70 bg-white/80 text-emerald-700 dark:border-emerald-500/25 dark:bg-slate-900/60 dark:text-emerald-200',
    iconBox:
      'border-emerald-200/80 bg-[linear-gradient(145deg,rgba(236,253,245,0.96),rgba(255,247,237,0.9))] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
    statGlow: 'from-emerald-500/12 via-amber-500/8 to-transparent',
  },
  web_format: {
    accentGlow:
      'bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_28%)]',
    accentText: 'text-teal-700 dark:text-teal-300',
    badge:
      'border-teal-200/80 bg-teal-50/85 text-teal-700 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-200',
    chip:
      'border-teal-200/70 bg-white/80 text-teal-700 dark:border-teal-500/25 dark:bg-slate-900/60 dark:text-teal-200',
    iconBox:
      'border-teal-200/80 bg-[linear-gradient(145deg,rgba(240,253,250,0.96),rgba(239,246,255,0.88))] text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200',
    statGlow: 'from-teal-500/12 via-sky-500/8 to-transparent',
  },
  data_format: {
    accentGlow:
      'bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.14),transparent_28%)]',
    accentText: 'text-indigo-700 dark:text-indigo-300',
    badge:
      'border-indigo-200/80 bg-indigo-50/85 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-200',
    chip:
      'border-indigo-200/70 bg-white/80 text-indigo-700 dark:border-indigo-500/25 dark:bg-slate-900/60 dark:text-indigo-200',
    iconBox:
      'border-indigo-200/80 bg-[linear-gradient(145deg,rgba(238,242,255,0.96),rgba(239,246,255,0.88))] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200',
    statGlow: 'from-indigo-500/12 via-sky-500/8 to-transparent',
  },
  ai: {
    accentGlow:
      'bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_26%)]',
    accentText: 'text-indigo-700 dark:text-indigo-300',
    badge:
      'border-indigo-200/80 bg-indigo-50/85 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-200',
    chip:
      'border-indigo-200/70 bg-white/80 text-indigo-700 dark:border-indigo-500/25 dark:bg-slate-900/60 dark:text-indigo-200',
    iconBox:
      'border-indigo-200/80 bg-[linear-gradient(145deg,rgba(238,242,255,0.96),rgba(250,245,255,0.9))] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200',
    statGlow: 'from-indigo-500/12 via-violet-500/8 to-transparent',
  },
  other: {
    accentGlow:
      'bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.12),transparent_28%)]',
    accentText: 'text-slate-700 dark:text-slate-300',
    badge:
      'border-slate-200/80 bg-slate-50/85 text-slate-700 dark:border-slate-500/25 dark:bg-slate-500/10 dark:text-slate-200',
    chip:
      'border-slate-200/70 bg-white/80 text-slate-700 dark:border-slate-500/25 dark:bg-slate-900/60 dark:text-slate-200',
    iconBox:
      'border-slate-200/80 bg-[linear-gradient(145deg,rgba(248,250,252,0.96),rgba(240,253,250,0.88))] text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-200',
    statGlow: 'from-slate-500/12 via-emerald-500/8 to-transparent',
  },
};

const featurePriority: ToolFeature[] = [
  ToolFeature.REAL_TIME,
  ToolFeature.DUAL_INPUT,
  ToolFeature.SINGLE_INPUT,
  ToolFeature.FILE_INPUT,
  ToolFeature.DRAG_DROP,
  ToolFeature.HISTORY,
  ToolFeature.COPY_RESULT,
  ToolFeature.EXPORT,
  ToolFeature.IMPORT,
  ToolFeature.AI_ASSIST,
  ToolFeature.AI_GENERATE,
];

const featureLabelMap: Record<ToolFeature, string> = {
  [ToolFeature.SINGLE_INPUT]: '单区输入',
  [ToolFeature.DUAL_INPUT]: '双栏工作流',
  [ToolFeature.FILE_INPUT]: '文件导入',
  [ToolFeature.DRAG_DROP]: '拖拽处理',
  [ToolFeature.HISTORY]: '历史记录',
  [ToolFeature.EXPORT]: '结果导出',
  [ToolFeature.IMPORT]: '内容导入',
  [ToolFeature.COPY_RESULT]: '一键复制',
  [ToolFeature.AI_ASSIST]: 'AI 辅助',
  [ToolFeature.AI_GENERATE]: 'AI 生成',
  [ToolFeature.REAL_TIME]: '实时反馈',
};

function getFeatureLabels(features: ToolFeature[]) {
  return featurePriority
    .filter((feature) => features.includes(feature))
    .slice(0, 4)
    .map((feature) => featureLabelMap[feature]);
}

function getInteractionMode(features: ToolFeature[]) {
  if (features.includes(ToolFeature.REAL_TIME)) {
    return '实时';
  }

  if (features.includes(ToolFeature.DUAL_INPUT)) {
    return '对照';
  }

  return '执行';
}

function getInputMode(features: ToolFeature[]) {
  if (features.includes(ToolFeature.FILE_INPUT) && features.includes(ToolFeature.SINGLE_INPUT)) {
    return '文本 + 文件';
  }

  if (features.includes(ToolFeature.FILE_INPUT)) {
    return '文件';
  }

  if (features.includes(ToolFeature.DUAL_INPUT)) {
    return '双栏';
  }

  return '文本';
}

type ToolPageShellProps = {
  toolId: string;
  children: ReactNode;
  className?: string;
  description?: string;
  heroActions?: ReactNode;
};

export function ToolPageShell({
  toolId,
  children,
  className,
  description,
  heroActions,
}: ToolPageShellProps) {
  const tool = toolRegistry.get(toolId);

  if (!tool) {
    throw new Error(`Unknown tool: ${toolId}`);
  }

  const Icon = iconMap[tool.icon] || Wrench;
  const categoryLabel = TOOL_CATEGORIES[tool.category];
  const theme = categoryThemeMap[tool.category];
  const features = getFeatureLabels(tool.features);
  const summaryItems = [
    { label: '交互', value: getInteractionMode(tool.features) },
    { label: '输入', value: getInputMode(tool.features) },
    { label: '能力', value: `${tool.features.length} 项` },
  ];

  return (
    <div className={cn('tool-page-shell min-h-screen pb-12', className)} data-tool-category={tool.category}>
      <ToolNavigation />
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur dark:border-white/10 dark:bg-slate-950/76 sm:p-7">
          <div className={cn('pointer-events-none absolute inset-0 opacity-100', theme.accentGlow)} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(248,250,252,0.92))] dark:bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.7))]" />
          <div className="pointer-events-none absolute -right-10 top-0 h-36 w-36 rounded-full bg-white/55 blur-3xl dark:bg-emerald-400/10" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                <span className={cn('rounded-full border px-3 py-1', theme.badge)}>{categoryLabel}</span>
                <span className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                  QHelper Workspace
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border shadow-[0_14px_30px_rgba(15,23,42,0.08)]',
                    theme.iconBox,
                  )}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <div className="space-y-3">
                  <h1 className="tool-hero-title text-balance font-mono text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50 sm:text-4xl">
                    {tool.name}
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
                    {description || tool.description}
                  </p>

                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {features.map((feature) => (
                        <span
                          key={feature}
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm',
                            theme.chip,
                          )}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 lg:max-w-md">
              <div className="grid grid-cols-3 gap-3">
                {summaryItems.map((item) => (
                  <div
                    key={item.label}
                    className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/72 px-4 py-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/58"
                  >
                    <div className={cn('absolute inset-0 bg-gradient-to-br', theme.statGlow)} />
                    <div className="relative">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                        {item.label}
                      </div>
                      <div className={cn('mt-2 text-lg font-semibold tracking-tight', theme.accentText)}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {heroActions ? <div className="flex flex-wrap gap-3">{heroActions}</div> : null}
            </div>
          </div>
        </section>

        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
