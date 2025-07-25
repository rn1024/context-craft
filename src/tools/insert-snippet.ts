import { z } from 'zod';
import * as fs from 'fs-extra';
import * as path from 'path';
import Handlebars from 'handlebars';

const InsertSnippetInputSchema = z.object({
  name: z.string().describe("代码片段模板名称"),
  variables: z.record(z.string()).optional().default({}),
  targetPath: z.string().optional().describe("目标文件路径（可选）"),
  insertMode: z.enum(['replace', 'append', 'prepend']).default('replace').describe("插入模式"),
  position: z.object({
    line: z.number().optional(),
    column: z.number().optional()
  }).optional()
});

export const insertSnippetTool = {
  name: 'insertSnippet',
  description: 'Insert saved code snippet with variable substitution',
  inputSchema: InsertSnippetInputSchema,
  
  invoke: async (input: z.infer<typeof InsertSnippetInputSchema>) => {
    const { name, variables, targetPath, insertMode, position } = input;
    
    try {
      const snippetsDir = path.join(process.cwd(), 'templates', 'snippets');
      const snippetDir = path.join(snippetsDir, name);
      
      if (!await fs.pathExists(snippetDir)) {
        throw new Error(`Snippet '${name}' not found`);
      }
      
      // 读取模板信息
      const snippetMeta = await fs.readJson(path.join(snippetDir, 'snippet.json'));
      const templateCode = await fs.readFile(path.join(snippetDir, 'template.code'), 'utf-8');
      
      // 合并变量（用户提供的优先）
      const mergedVariables = {
        ...snippetMeta.variables.reduce((acc: any, v: any) => {
          acc[v.name] = v.defaultValue || '';
          return acc;
        }, {}),
        ...variables
      };
      
      // 验证必需变量
      const missingVars = snippetMeta.variables.filter((v: any) => 
        v.required && !mergedVariables[v.name]
      );
      
      if (missingVars.length > 0) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Missing required variables:\n` +
                    missingVars.map((v: any) => `  - ${v.name}: ${v.description}`).join('\n') +
                    `\n\nPlease provide these variables in the 'variables' parameter.`
            }
          ],
          missingVariables: missingVars.map((v: any) => v.name)
        };
      }
      
      // 渲染模板
      const template = Handlebars.compile(templateCode);
      const renderedCode = template(mergedVariables);
      
      // 确定目标文件
      let finalTargetPath = targetPath;
      if (!finalTargetPath) {
        const suggestedName = `${name}.${getFileExtension(snippetMeta.language)}`;
        finalTargetPath = path.join(process.cwd(), suggestedName);
      }
      
      // 处理文件插入
      let finalContent = renderedCode;
      let operation = 'created';
      
      if (await fs.pathExists(finalTargetPath)) {
        const existingContent = await fs.readFile(finalTargetPath, 'utf-8');
        
        switch (insertMode) {
          case 'append':
            finalContent = existingContent + '\n\n' + renderedCode;
            operation = 'appended to';
            break;
          case 'prepend':
            finalContent = renderedCode + '\n\n' + existingContent;
            operation = 'prepended to';
            break;
          case 'replace':
          default:
            operation = 'replaced';
            break;
        }
      }
      
      await fs.writeFile(finalTargetPath, finalContent);
      
      // 更新使用统计
      snippetMeta.usage.count += 1;
      snippetMeta.usage.lastUsed = new Date().toISOString();
      await fs.writeJson(path.join(snippetDir, 'snippet.json'), snippetMeta, { spaces: 2 });
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Snippet '${name}' ${operation} successfully!\n\n` +
                  `📁 File: ${path.relative(process.cwd(), finalTargetPath)}\n` +
                  `📊 Lines: ${renderedCode.split('\n').length}\n` +
                  `📝 Language: ${snippetMeta.language}\n` +
                  `🔧 Variables used: ${Object.keys(variables).join(', ')}\n\n` +
                  `💡 Next steps:\n` +
                  `  - ${operation === 'created' ? 'Review and customize the generated code' : 'Check the updated file content'}\n` +
                  `  - Run tests if applicable: @context-craft runTests`
          }
        ],
        filePath: finalTargetPath,
        lineCount: renderedCode.split('\n').length,
        variables: mergedVariables
      };
      
    } catch (error) {
      throw new Error(`Failed to insert snippet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    typescript: 'ts',
    javascript: 'js',
    python: 'py',
    java: 'java',
    csharp: 'cs',
    go: 'go',
    rust: 'rs',
    vue: 'vue',
    react: 'tsx',
    jsx: 'jsx',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    yaml: 'yaml',
    xml: 'xml'
  };
  
  return extensions[language] || 'txt';
}