import { z } from 'zod';
import { execa } from 'execa';
import * as fs from 'fs-extra';
import * as path from 'path';

const RunTestsInputSchema = z.object({
  testFiles: z.array(z.string()).optional(),
  testCommand: z.string().optional().default('npm test'),
  coverage: z.boolean().default(false),
  watch: z.boolean().default(false),
});

export const runTestsTool = {
  name: 'runTests',
  description: 'Run project tests with coverage and reporting',
  inputSchema: RunTestsInputSchema,
  
  invoke: async (input: z.infer<typeof RunTestsInputSchema>) => {
    const { testFiles, testCommand, coverage, watch } = input;
    
    try {
      const args = testCommand.split(' ');
      const command = args[0];
      const baseArgs = args.slice(1);
      
      const finalArgs = [...baseArgs];
      
      if (coverage) {
        finalArgs.push('--coverage');
      }
      
      if (watch) {
        finalArgs.push('--watch');
      }
      
      if (testFiles && testFiles.length > 0) {
        finalArgs.push(...testFiles);
      }

      const { stdout, stderr, exitCode } = await execa(command, finalArgs, {
        cwd: process.cwd(),
        reject: false,
      });

      const summary = parseTestOutput(stdout || '');

      return {
        content: [
          {
            type: 'text',
            text: `Test Results:\n` +
              `Exit Code: ${exitCode}\n` +
              `Passed: ${summary.passed}\n` +
              `Failed: ${summary.failed}\n` +
              `Total: ${summary.total}\n` +
              `Coverage: ${summary.coverage || 'N/A'}\n\n` +
              `Output:\n${stdout || stderr || 'No output'}`
          }
        ],
        exitCode,
        passed: summary.passed,
        failed: summary.failed,
        total: summary.total,
        coverage: summary.coverage,
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Test execution failed: ${error.message}`
          }
        ],
        exitCode: 1,
        passed: 0,
        failed: 0,
        total: 0,
        coverage: null,
      };
    }
  }
};

function parseTestOutput(output: string): { passed: number; failed: number; total: number; coverage?: string } {
  const lines = output.split('\n');
  let passed = 0;
  let failed = 0;
  let total = 0;
  let coverage = undefined;

  for (const line of lines) {
    if (line.includes('Tests:')) {
      const match = line.match(/(\d+) passed, (\d+) failed, (\d+) total/);
      if (match) {
        passed = parseInt(match[1]);
        failed = parseInt(match[2]);
        total = parseInt(match[3]);
      }
    }
    if (line.includes('% coverage')) {
      coverage = line.trim();
    }
  }

  return { passed, failed, total, coverage };
}