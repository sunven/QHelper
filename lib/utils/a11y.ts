/**
 * 无障碍访问 (a11y) 工具函数
 */

/**
 * 生成唯一 ID
 */
let idCounter = 0;
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * 创建可访问的弹窗属性
 */
export interface A11yDialogProps {
  role: 'dialog' | 'alertdialog';
  'aria-modal': boolean;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export function createDialogProps(
  labelledBy?: string,
  describedBy?: string,
  type: 'dialog' | 'alertdialog' = 'dialog'
): A11yDialogProps {
  const props: A11yDialogProps = {
    role: type,
    'aria-modal': true,
  };

  if (labelledBy) {
    props['aria-labelledby'] = labelledBy;
  }
  if (describedBy) {
    props['aria-describedby'] = describedBy;
  }

  return props;
}

/**
 * 创建可访问的按钮属性
 */
export interface A11yButtonProps {
  role: 'button';
  tabIndex: number;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  onKeyPress?: (e: React.KeyboardEvent) => void;
}

export function createButtonProps(props: {
  label?: string;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  isNativeButton?: boolean;
}): Partial<A11yButtonProps> {
  const a11yProps: Partial<A11yButtonProps> = {};

  if (props.label) {
    a11yProps['aria-label'] = props.label;
  }
  if (props.pressed !== undefined) {
    a11yProps['aria-pressed'] = props.pressed;
  }
  if (props.expanded !== undefined) {
    a11yProps['aria-expanded'] = props.expanded;
  }
  if (props.controls) {
    a11yProps['aria-controls'] = props.controls;
  }

  return a11yProps;
}

/**
 * 创建可访问的输入框属性
 */
export interface A11yInputProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  'aria-autocomplete'?: 'list' | 'both' | 'none';
}

export function createInputProps(props: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  invalid?: boolean;
  required?: boolean;
  autocomplete?: boolean;
}): A11yInputProps {
  const a11yProps: A11yInputProps = {};

  if (props.label) {
    a11yProps['aria-label'] = props.label;
  }
  if (props.labelledBy) {
    a11yProps['aria-labelledby'] = props.labelledBy;
  }
  if (props.describedBy) {
    a11yProps['aria-describedby'] = props.describedBy;
  }
  if (props.invalid) {
    a11yProps['aria-invalid'] = true;
  }
  if (props.required) {
    a11yProps['aria-required'] = true;
  }
  if (props.autocomplete) {
    a11yProps['aria-autocomplete'] = 'list';
  }

  return a11yProps;
}

/**
 * 创建实时区域属性（用于屏幕阅读器公告）
 */
export function createLiveRegionProps(
  type: 'polite' | 'assertive' | 'off' = 'polite'
): { 'aria-live': string; 'aria-atomic': boolean } {
  return {
    'aria-live': type,
    'aria-atomic': true,
  };
}

/**
 * 焦点管理工具
 */
export class FocusManager {
  private previouslyFocusedElement: HTMLElement | null = null;

  /**
   * 保存当前焦点元素
   */
  saveFocus() {
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
  }

  /**
   * 恢复之前保存的焦点
   */
  restoreFocus() {
    if (this.previouslyFocusedElement && this.previouslyFocusedElement.focus) {
      this.previouslyFocusedElement.focus();
    }
  }

  /**
   * 将焦点移到指定元素
   */
  focusElement(element: HTMLElement | null) {
    if (element && element.focus) {
      element.focus();
    }
  }

  /**
   * 将焦点移到指定选择器的第一个元素
   */
  focusSelector(selector: string) {
    const element = document.querySelector(selector) as HTMLElement;
    this.focusElement(element);
  }

  /**
   * 在容器内捕获焦点（用于弹窗等）
   */
  trapFocus(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
}

/**
 * 键盘导航支持
 */
export type KeyboardAction = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: (e: KeyboardEvent) => void;
  description?: string;
};

export function createKeyboardHandler(
  actions: KeyboardAction[],
  options: { preventDefault?: boolean } = {}
): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    for (const action of actions) {
      const keyMatch = e.key.toLowerCase() === action.key.toLowerCase();
      const ctrlMatch = action.ctrlKey === undefined || e.ctrlKey === action.ctrlKey;
      const metaMatch = action.metaKey === undefined || e.metaKey === action.metaKey;
      const shiftMatch = action.shiftKey === undefined || e.shiftKey === action.shiftKey;
      const altMatch = action.altKey === undefined || e.altKey === action.altKey;

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        if (options.preventDefault !== false) {
          e.preventDefault();
        }
        action.action(e);
        return;
      }
    }
  };
}

/**
 * 屏幕阅读器公告（不改变视觉内容）
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // 清理
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * 跳转到主内容链接（对屏幕阅读器友好）
 */
export function SkipLink({ target, children }: { target: string; children: React.ReactNode }) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetElement = document.querySelector(target);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
      (targetElement as HTMLElement).focus();
    }
  };

  return (
    <a
      href={target}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
    >
      {children}
    </a>
  );
}
