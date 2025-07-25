import { z } from 'zod';
import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

const CodeSearchInputSchema = z.object({
  query: z.string().min(1),
  path: z.string().optional().default('.'),
  fileTypes: z.array(z.string()).optional().default(['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go', '.rs']),
  maxResults: z.number().min(1).max(50).default(10),
});

export const codeSearchTool = {
  name: 'codeSearch',
  description: 'Semantic and keyword search through project codebase',
  inputSchema: CodeSearchInputSchema,
  
  invoke: async (input: z.infer<typeof CodeSearchInputSchema>) => {
    const { query, path: searchPath, fileTypes, maxResults } = input;
    
    try {
      const patterns = fileTypes.map(ext => `**/*${ext}`);
      const files = await glob(patterns, {
        cwd: searchPath,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      });
      
      const matches = [];
      
      for (const file of files.slice(0, maxResults * 2)) {
        const fullPath = path.join(searchPath, file);
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          
          // 简单关键词匹配（可扩展为语义搜索）
          const lowerQuery = query.toLowerCase();
          const lowerContent = content.toLowerCase();
          
          if (lowerContent.includes(lowerQuery)) {
            const lines = content.split('\n');
            const matchLines = [];
            
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(lowerQuery)) {
                matchLines.push({
                  line: i + 1,
                  content: lines[i].trim(),
                });
              }
            }
            
            if (matchLines.length > 0) {
              matches.push({
                file: file,
                matches: matchLines.slice(0, 5),
                preview: content.substring(0, 300) + (content.length > 300 ? '...' : ''),
              });
            }
          }
        } catch (error) {
          // 跳过无法读取的文件
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${matches.length} matches for "${query}":\n\n${
              matches.map(m => 
                `📁 ${m.file}\n${m.matches.map(l => `  ${l.line}: ${l.content}`).join('\n')}\n`
              ).join('\n')
            }`,
          }
        ],
        matches: matches.slice(0, maxResults),
      };
    } catch (error) {
      throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};