import { z } from 'zod';
import * as fs from 'fs-extra';
import * as path from 'path';
import Handlebars from 'handlebars';
import { ThinkingEngine } from '../services/thinking-engine.js';

const ScaffoldInputSchema = z.object({
  type: z.enum(['web-api', 'microservice', 'frontend-comp', 'cli']),
  name: z.string().min(1).max(50),
  lang: z.enum(['ts', 'js']).default('ts'),
  features: z.array(z.string()).optional().default([]),
});

export const scaffoldTool = {
  name: 'scaffold',
  description: 'Generate code scaffolding for web API, microservice, frontend component or CLI tool',
  inputSchema: ScaffoldInputSchema,
  
  invoke: async (input: z.infer<typeof ScaffoldInputSchema>) => {
    const { type, name, lang, features } = input;
    
    // 内部思考过程
    const thinkingEngine = new ThinkingEngine();
    const { thinkingLog } = await thinkingEngine.processWithContext('scaffold', input, {
      type, name, lang, features
    });

    const templatePath = path.join(process.cwd(), 'templates', type);
    const outputPath = path.join(process.cwd(), 'generated', name);
    
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template type '${type}' not found`);
    }
    
    const context = {
      name,
      PascalName: name.charAt(0).toUpperCase() + name.slice(1),
      kebabName: name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, ''),
      lang,
      features,
    };
    
    const generatedFiles = await renderTemplate(templatePath, outputPath, context);
    
    return {
      content: [
        {
          type: 'text',
          text: `Generated ${type} scaffolding for '${name}':\n\n` +
                `Thinking process:\n${thinkingLog.map(t => `  ${t.step}. ${t.content}`).join('\n')}\n\n` +
                `Generated files:\n${generatedFiles.map(f => `- ${f.path}`).join('\n')}`,
        }
      ],
      files: generatedFiles,
    };
  }
};

async function renderTemplate(templateDir: string, outputDir: string, context: any): Promise<Array<{path: string, content: string}>> {
  const files: Array<{path: string, content: string}> = [];
  
  if (!await fs.pathExists(outputDir)) {
    await fs.ensureDir(outputDir);
  }
  
  const templateFiles = await fs.readdir(templateDir, { recursive: true });
  
  for (const file of templateFiles) {
    if (typeof file === 'string') {
      const templateFile = path.join(templateDir, file);
      const outputFile = path.join(outputDir, file);
      
      if ((await fs.stat(templateFile)).isFile()) {
        let content = await fs.readFile(templateFile, 'utf-8');
        
        // 处理模板变量
        const template = Handlebars.compile(content);
        const rendered = template(context);
        
        // 重命名文件（处理模板文件名）
        const finalPath = outputFile.replace(/\{\{(\w+)\}\}/g, (match, key) => context[key] || match);
        
        await fs.ensureDir(path.dirname(finalPath));
        await fs.writeFile(finalPath, rendered);
        
        files.push({
          path: path.relative(process.cwd(), finalPath),
          content: rendered,
        });
      }
    }
  }
  
  return files;
}