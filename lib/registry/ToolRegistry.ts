import type { ToolMetadata, ToolCategory } from './ToolMetadata';
import { tools as toolList } from './tools';

/**
 * 工具注册表
 *
 * 负责工具的注册、查询、搜索和分类
 */
export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolMetadata> = new Map();
  private categoryIndex: Map<ToolCategory, Set<string>> = new Map();
  private keywordIndex: Map<string, Set<string>> = new Map();

  private constructor() {
    this.initializeIndexes();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * 初始化索引
   */
  private initializeIndexes(): void {
    toolList.forEach(tool => this.register(tool));
  }

  /**
   * 注册工具
   */
  public register(tool: ToolMetadata): void {
    // 注册主索引
    this.tools.set(tool.id, tool);

    // 注册分类索引
    if (!this.categoryIndex.has(tool.category)) {
      this.categoryIndex.set(tool.category, new Set());
    }
    this.categoryIndex.get(tool.category)!.add(tool.id);

    // 注册关键词索引
    tool.keywords.forEach(keyword => {
      const key = keyword.toLowerCase();
      if (!this.keywordIndex.has(key)) {
        this.keywordIndex.set(key, new Set());
      }
      this.keywordIndex.get(key)!.add(tool.id);
    });

    // 注册名称索引
    const nameKeys = [
      tool.name.toLowerCase(),
      tool.nameEn.toLowerCase(),
      ...tool.tags,
    ];
    nameKeys.forEach(key => {
      if (!this.keywordIndex.has(key)) {
        this.keywordIndex.set(key, new Set());
      }
      this.keywordIndex.get(key)!.add(tool.id);
    });
  }

  /**
   * 获取工具元数据
   */
  public get(id: string): ToolMetadata | undefined {
    return this.tools.get(id);
  }

  /**
   * 获取所有工具
   */
  public getAll(): ToolMetadata[] {
    return Array.from(this.tools.values());
  }

  /**
   * 按分类获取工具
   */
  public getByCategory(category: ToolCategory): ToolMetadata[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) return [];
    return Array.from(ids)
      .map(id => this.tools.get(id))
      .filter((tool): tool is ToolMetadata => tool !== undefined);
  }

  /**
   * 搜索工具
   */
  public search(query: string): ToolMetadata[] {
    if (!query.trim()) return this.getAll();

    const lowerQuery = query.toLowerCase();
    const results = new Set<ToolMetadata>();

    // 精确匹配 ID
    if (this.tools.has(lowerQuery)) {
      results.add(this.tools.get(lowerQuery)!);
    }

    // 关键词匹配
    for (const [keyword, toolIds] of this.keywordIndex) {
      if (keyword.includes(lowerQuery)) {
        toolIds.forEach(id => {
          const tool = this.tools.get(id);
          if (tool) results.add(tool);
        });
      }
    }

    return Array.from(results);
  }

  /**
   * 获取分类列表
   */
  public getCategories(): ToolCategory[] {
    return Array.from(this.categoryIndex.keys());
  }
}

/**
 * 导出单例
 */
export const toolRegistry = ToolRegistry.getInstance();
