import { z } from 'zod';
import * as fs from 'fs-extra';
import * as path from 'path';

const ListSnippetsInputSchema = z.object({
  tags: z.array(z.string()).optional().describe("按标签过滤"),
  language: z.string().optional().describe("按语言过滤"),
  search: z.string().optional().describe("搜索关键词"),
  limit: z.number().min(1).max(50).default(10).describe("返回数量限制"),
  sortBy: z.enum(['name', 'created', 'usage', 'size']).default('created').describe("排序方式")
});

export const listSnippetsTool = {
  name: 'listSnippets',
  description: 'List all saved code snippets with filtering and search capabilities',
  inputSchema: ListSnippetsInputSchema,
  
  invoke: async (input: z.infer<typeof ListSnippetsInputSchema>) => {
    const { tags, language, search, limit, sortBy } = input;
    
    try {
      const snippetsDir = path.join(process.cwd(), 'templates', 'snippets');
      
      if (!await fs.pathExists(snippetsDir)) {
        return {
          content: [
            {
              type: 'text',
              text: `📭 No snippets found. Create your first snippet with:\n\n@context-craft saveSnippet {\n  "name": "my-first-snippet",\n  "description": "Description of your snippet",\n  "code": "// Your code here",\n  "language": "typescript"\n}`
            }
          ],
          total: 0,
          snippets: []
        };
      }
      
      const snippetDirs = await fs.readdir(snippetsDir);
      const snippets = [];
      
      for (const dir of snippetDirs) {
        const snippetDir = path.join(snippetsDir, dir);
        const metaFile = path.join(snippetDir, 'snippet.json');
        
        if (await fs.pathExists(metaFile)) {
          try {
            const meta = await fs.readJson(metaFile);
            snippets.push({
              ...meta,
              dir: dir,
              preview: meta.template?.code?.substring(0, 200) + '...'
            });
          } catch (error) {
            console.warn(`Skipping invalid snippet: ${dir}`);
          }
        }
      }
      
      // 应用过滤
      let filteredSnippets = snippets;
      
      if (language) {
        filteredSnippets = filteredSnippets.filter(s => 
          s.language?.toLowerCase().includes(language.toLowerCase())
        );
      }
      
      if (tags && tags.length > 0) {
        filteredSnippets = filteredSnippets.filter(s => 
          tags.some(tag => s.tags?.includes(tag))
        );
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredSnippets = filteredSnippets.filter(s => 
          s.name?.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower) ||
          s.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      // 排序
      filteredSnippets.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'usage':
            return (b.usage?.count || 0) - (a.usage?.count || 0);
          case 'size':
            return (b.context?.size || 0) - (a.context?.size || 0);
          case 'created':
          default:
            return new Date(b.context?.createdAt || 0).getTime() - new Date(a.context?.createdAt || 0).getTime();
        }
      });
      
      // 限制结果数量
      const limitedSnippets = filteredSnippets.slice(0, limit);
      
      if (limitedSnippets.length === 0) {
        let message = `🔍 No snippets found`;
        const filters = [];
        if (language) filters.push(`language: ${language}`);
        if (tags?.length) filters.push(`tags: ${tags.join(', ')}`);
        if (search) filters.push(`search: "${search}"`);
        
        if (filters.length > 0) {
          message += ` with filters: ${filters.join(', ')}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: message
            }
          ],
          total: 0,
          snippets: []
        };
      }
      
      // 格式化输出
      const formattedOutput = limitedSnippets.map((snippet, index) => 
        `${index + 1}. **${snippet.name}** (${snippet.language})
   ${snippet.description}
   📊 ${snippet.context?.lineCount} lines | 🔧 ${snippet.variables?.length || 0} variables | 📈 ${snippet.usage?.count || 0} uses
   🏷️ ${snippet.tags?.join(', ') || 'no tags'}
   💡 @context-craft insertSnippet {"name":"${snippet.name}"}`
      ).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `📋 Found ${filteredSnippets.length} snippet${filteredSnippets.length !== 1 ? 's' : ''}${filteredSnippets.length > limit ? ` (showing ${limit})` : ''}:\n\n${formattedOutput}\n\n🔍 Use filters to narrow results:\n@context-craft listSnippets {"language":"typescript","tags":["function","react"]}`
          }
        ],
        total: filteredSnippets.length,
        snippets: limitedSnippets
      };
      
    } catch (error) {
      throw new Error(`Failed to list snippets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};