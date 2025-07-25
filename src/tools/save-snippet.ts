import { z } from 'zod';
import * as fs from 'fs-extra';
import * as path from 'path';
import { createHash } from 'crypto';

const SaveSnippetTemplateInputSchema = z.object({
  name: z.string().min(1).max(50).describe("代码片段模板名称"),
  description: z.string().max(200).describe("代码片段描述"),
  code: z.string().min(1).describe("代码内容"),
  language: z.string().default("typescript").describe("编程语言"),
  tags: z.array(z.string()).optional().default([]),
  variables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    defaultValue: z.string().optional(),
    required: z.boolean().default(false)
  })).optional().default([]),
  context: z.object({
    filePath: z.string().optional().describe("原始文件路径"),
    lineRange: z.object({
      start: z.number(),
      end: z.number()
    }).optional(),
    imports: z.array(z.string()).optional().default([]),
    dependencies: z.array(z.string()).optional().default([])
  }).optional()
});

export const saveSnippetTool = {
  name: 'saveSnippet',
  description: 'Save selected code as reusable template with variables and context',
  inputSchema: SaveSnippetTemplateInputSchema,
  
  invoke: async (input: z.infer<typeof SaveSnippetTemplateInputSchema>) => {
    const { name, description, code, language, tags, variables, context } = input;
    
    try {
      const snippetsDir = path.join(process.cwd(), 'templates', 'snippets');
      await fs.ensureDir(snippetsDir);
      
      // 生成唯一的模板ID
      const templateId = createHash('md5').update(`${name}-${Date.now()}`).digest('hex').substring(0, 8);
      const templateDir = path.join(snippetsDir, name);
      await fs.ensureDir(templateDir);
      
      // 分析代码提取变量和模式
      const analysis = await analyzeCode(code, language, variables);
      
      // 创建代码片段元数据
      const snippetMeta = {
        id: templateId,
        name,
        description,
        language,
        tags: [...new Set([...tags, ...analysis.autoTags])],
        variables: [...variables, ...analysis.autoVariables],
        context: {
          ...context,
          createdAt: new Date().toISOString(),
          originalCode: code,
          lineCount: code.split('\n').length,
          size: code.length
        },
        usage: {
          count: 0,
          lastUsed: null
        },
        template: {
          code: analysis.templateCode,
          placeholders: analysis.placeholders
        }
      };

      // 保存元数据
      await fs.writeJson(path.join(templateDir, 'snippet.json'), snippetMeta, { spaces: 2 });
      
      // 保存代码文件
      await fs.writeFile(path.join(templateDir, 'template.code'), analysis.templateCode);
      
      // 保存示例使用
      const exampleUsage = generateExampleUsage(snippetMeta);
      await fs.writeFile(path.join(templateDir, 'example.ts'), exampleUsage);
      
      // 创建快速插入文件
      const quickInsert = generateQuickInsert(snippetMeta);
      await fs.writeFile(path.join(templateDir, 'quick-insert.json'), JSON.stringify(quickInsert, null, 2));

      return {
        content: [
          {
            type: 'text',
            text: `✅ Code snippet '${name}' saved successfully!\n\n` +
                  `📁 Template ID: ${templateId}\n` +
                  `📝 Language: ${language}\n` +
                  `🏷️ Tags: ${snippetMeta.tags.join(', ')}\n` +
                  `📊 Lines: ${snippetMeta.context.lineCount}\n` +
                  `🔧 Variables: ${snippetMeta.variables.map(v => v.name).join(', ')}\n\n` +
                  `📂 Location: templates/snippets/${name}/\n\n` +
                  `💡 Use with: @context-craft insertSnippet {"name":"${name}"}\n` +
                  `🔄 Or: @context-craft listSnippets to see all saved snippets`
          }
        ],
        templateId,
        name,
        variables: snippetMeta.variables,
        tags: snippetMeta.tags
      };
    } catch (error) {
      throw new Error(`Failed to save snippet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

async function analyzeCode(code: string, language: string, providedVariables: any[]): Promise<any> {
  const autoTags = [];
  const autoVariables = [];
  const placeholders = [];
  
  // 根据语言添加标签
  const langTags = {
    typescript: ['ts', 'typed'],
    javascript: ['js', 'vanilla'],
    python: ['py', 'python'],
    react: ['react', 'jsx', 'tsx'],
    vue: ['vue', 'composition-api']
  };
  
  if (langTags[language]) {
    autoTags.push(...langTags[language]);
  }
  
  // 自动检测代码模式
  if (code.includes('function') || code.includes('=>')) autoTags.push('function');
  if (code.includes('class') || code.includes('interface')) autoTags.push('class');
  if (code.includes('export') || code.includes('import')) autoTags.push('module');
  if (code.includes('async') || code.includes('await')) autoTags.push('async');
  if (code.includes('useState') || code.includes('useEffect')) autoTags.push('react-hooks');
  
  // 自动检测变量
  const variableRegex = /\{\{(\w+)\}\}/g;
  const matches = code.match(variableRegex);
  
  if (matches) {
    matches.forEach(match => {
      const varName = match.replace(/\{\{|\}\}/g, '');
      if (!providedVariables.some(v => v.name === varName)) {
        autoVariables.push({
          name: varName,
          description: `Auto-detected variable: ${varName}`,
          required: true
        });
      }
      placeholders.push(varName);
    });
  }
  
  // 创建模板代码
  let templateCode = code;
  
  return {
    autoTags: [...new Set(autoTags)],
    autoVariables,
    placeholders,
    templateCode
  };
}

function generateExampleUsage(snippet: any): string {
  const { name, language, variables } = snippet;
  
  let example = `// Example usage of ${name} snippet\n`;
  example += `// Generated from template: ${name}\n\n`;
  
  if (variables.length > 0) {
    example += `// Available variables:\n`;
    variables.forEach(v => {
      example += `// - ${v.name}: ${v.description}${v.defaultValue ? ` (default: ${v.defaultValue})` : ''}\n`;
    });
    example += `\n`;
  }
  
  example += `// Usage:\n`;
  example += `// Use @context-craft insertSnippet {"name":"${name}", "variables":{...}}\n`;
  
  return example;
}

function generateQuickInsert(snippet: any): any {
  return {
    name: snippet.name,
    description: snippet.description,
    language: snippet.language,
    command: `@context-craft insertSnippet`,
    parameters: {
      name: snippet.name,
      variables: snippet.variables.reduce((acc: any, v: any) => {
        acc[v.name] = v.defaultValue || '';
        return acc;
      }, {})
    },
    tags: snippet.tags
  };
}