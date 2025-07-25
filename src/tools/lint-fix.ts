import { z } from 'zod';
import { execa } from 'execa';
import * as fs from 'fs-extra';
import * as path from 'path';

const LintFixInputSchema = z.object({
  files: z.array(z.string()).optional(),
  config: z.string().optional().default('.eslintrc.js'),
  fix: z.boolean().default(true),
});

export const lintFixTool = {
  name: 'lintFix',
  description: 'Lint and auto-fix JavaScript/TypeScript code using ESLint',
  inputSchema: LintFixInputSchema,
  
  invoke: async (input: z.infer<typeof LintFixInputSchema>) => {
    const { files, config, fix } = input;
    
    try {
      const targetFiles = files || ['src/**/*.{js,ts,jsx,tsx}'];
      const eslintArgs = [
        'eslint',
        ...targetFiles,
        ...(fix ? ['--fix'] : []),
        '--format', 'json',
        '--config', config,
      ];

      const { stdout, stderr } = await execa('npx', eslintArgs, {
        cwd: process.cwd(),
        reject: false,
      });

      let results = [];
      try {
        results = JSON.parse(stdout || '[]');
      } catch {
        results = [];
      }

      const fixedFiles = results.filter(r => r.messages.length === 0).map(r => r.filePath);
      const remainingIssues = results.filter(r => r.messages.length > 0);

      return {
        content: [
          {
            type: 'text',
            text: `Lint results:\n` +
              `Fixed files: ${fixedFiles.length}\n` +
              `Remaining issues: ${remainingIssues.length}\n\n` +
              remainingIssues.map(r => 
                `${r.filePath}: ${r.messages.length} issues\n` +
                r.messages.map(m => `  Line ${m.line}: ${m.message}`).join('\n')
              ).join('\n\n')
          }
        ],
        fixedFiles,
        remainingIssues,
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Lint failed: ${error.message}`
          }
        ],
        fixedFiles: [],
        remainingIssues: []
      };
    }
  }
};