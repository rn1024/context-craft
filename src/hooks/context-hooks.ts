import { z } from 'zod';

export interface BusinessContext {
  projectStructure?: string;
  codingStandards?: string;
  latestCodeSnippets?: string[];
  apiDocumentation?: string;
  testCases?: string[];
}

export class ContextHooks {
  private contextCache = new Map<string, BusinessContext>();

  async injectBusinessContext(thoughtArgs: any): Promise<any> {
    const context = await this.gatherContext(thoughtArgs.thought || '');
    
    // 将业务上下文注入到思考过程中
    const enrichedArgs = {
      ...thoughtArgs,
      businessContext: context,
    };

    return enrichedArgs;
  }

  private async gatherContext(thought: string): Promise<BusinessContext> {
    const cacheKey = this.generateCacheKey(thought);
    
    if (this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey)!;
    }

    const context: BusinessContext = {
      projectStructure: await this.getProjectStructure(),
      codingStandards: await this.getCodingStandards(),
      latestCodeSnippets: await this.getRelevantCode(thought),
      apiDocumentation: await this.getApiDocs(thought),
      testCases: await this.getTestCases(thought),
    };

    this.contextCache.set(cacheKey, context);
    return context;
  }

  private async getProjectStructure(): Promise<string> {
    // 简化的项目结构检测
    return `Project structure:\n- src/\n- tests/\n- docs/\n- .github/workflows/`;
  }

  private async getCodingStandards(): Promise<string> {
    return `Coding standards:\n- TypeScript with strict mode\n- ESLint + Prettier\n- Vitest for testing\n- Semantic commit messages`;
  }

  private async getRelevantCode(query: string): Promise<string[]> {
    // 基于查询返回相关代码片段
    const keywords = query.toLowerCase().split(' ');
    return [
      `// Example: User authentication middleware\nexport const authMiddleware = async (req, res, next) => {\n  // Implementation...\n};`,
      `// Example: Error handling pattern\nclass AppError extends Error {\n  constructor(message, statusCode) {\n    super(message);\n    this.statusCode = statusCode;\n  }\n}`,
    ];
  }

  private async getApiDocs(query: string): Promise<string> {
    return `API documentation for: ${query}\n- RESTful endpoints\n- OpenAPI specification\n- Error response formats`;
  }

  private async getTestCases(query: string): Promise<string[]> {
    return [
      `describe('${query}', () => {\n  it('should handle basic functionality', () => {\n    // Test implementation\n  });\n});`,
    ];
  }

  private generateCacheKey(thought: string): string {
    return thought.toLowerCase().replace(/\s+/g, '_').substring(0, 50);
  }
}