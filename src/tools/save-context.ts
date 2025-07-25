import { z } from 'zod';
import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

const SaveContextTemplateInputSchema = z.object({
  name: z.string().min(1).max(50).describe("模板名称"),
  description: z.string().max(200).describe("模板描述"),
  includePatterns: z.array(z.string()).optional().default([
    "package.json",
    "tsconfig.json",
    "**/*.config.*",
    ".eslintrc.*",
    ".prettierrc.*",
    "src/**/*",
    "tests/**/*",
    "docs/**/*"
  ]),
  excludePatterns: z.array(z.string()).optional().default([
    "node_modules/**",
    "dist/**",
    ".git/**",
    "*.log",
    "coverage/**"
  ]),
  metadata: z.object({
    techStack: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional()
  }).optional()
});

export const saveContextTemplateTool = {
  name: 'saveContextTemplate',
  description: 'Save current project structure, tech stack and coding style as a reusable template',
  inputSchema: SaveContextTemplateInputSchema,
  
  invoke: async (input: z.infer<typeof SaveContextTemplateInputSchema>) => {
    const { name, description, includePatterns, excludePatterns, metadata } = input;
    
    try {
      const templateDir = path.join(process.cwd(), 'templates', 'saved', name);
      await fs.ensureDir(templateDir);
      
      // 收集项目信息
      const projectInfo = await collectProjectInfo(includePatterns, excludePatterns);
      
      // 创建模板元数据
      const templateMeta = {
        name,
        description,
        createdAt: new Date().toISOString(),
        projectInfo,
        metadata: {
          ...metadata,
          techStack: metadata?.techStack || await detectTechStack(),
          features: metadata?.features || await detectFeatures()
        }
      };

      // 保存元数据
      await fs.writeJson(path.join(templateDir, 'template.json'), templateMeta, { spaces: 2 });

      // 保存文件内容
      const savedFiles = [];
      for (const pattern of includePatterns) {
        const files = await glob(pattern, { 
          ignore: excludePatterns,
          cwd: process.cwd() 
        });
        
        for (const file of files) {
          const sourcePath = path.join(process.cwd(), file);
          const targetPath = path.join(templateDir, file);
          
          try {
            const content = await fs.readFile(sourcePath, 'utf-8');
            await fs.ensureDir(path.dirname(targetPath));
            await fs.writeFile(targetPath, content);
            savedFiles.push(file);
          } catch (error) {
            // 跳过无法读取的文件
            console.warn(`Skipping ${file}: ${error}`);
          }
        }
      }

      // 生成项目结构快照
      const structure = await generateProjectStructure();
      await fs.writeJson(path.join(templateDir, 'structure.json'), structure, { spaces: 2 });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Template '${name}' saved successfully!\n\n` +
                  `📁 Files saved: ${savedFiles.length}\n` +
                  `📋 Tech stack: ${templateMeta.metadata.techStack.join(', ')}\n` +
                  `🏷️ Features: ${templateMeta.metadata.features.join(', ')}\n\n` +
                  `📂 Template location: templates/saved/${name}/\n\n` +
                  `💡 Use with: @context-craft scaffold {"type":"saved","name":"${name}"}`
          }
        ],
        templateName: name,
        files: savedFiles,
        structure: structure
      };
    } catch (error) {
      throw new Error(`Failed to save template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

async function collectProjectInfo(includePatterns: string[], excludePatterns: string[]): Promise<any> {
  const projectRoot = process.cwd();
  
  // 收集package信息
  let packageInfo = {};
  try {
    packageInfo = await fs.readJson(path.join(projectRoot, 'package.json'));
  } catch {}

  // 收集配置文件
  const configFiles = await glob('**/*.{json,yml,yaml,js,ts}', { 
    ignore: excludePatterns,
    cwd: projectRoot 
  });

  // 生成目录结构
  const structure = await generateProjectStructure();

  return {
    package: packageInfo,
    configFiles: configFiles.filter(f => f.includes('config') || f.startsWith('.')).slice(0, 10),
    structure,
    stats: {
      totalFiles: (await glob('**/*', {ignore: excludePatterns, cwd: projectRoot})).length,
      totalLines: await countTotalLines(includePatterns, excludePatterns)
    }
  };
}

async function detectTechStack(): Promise<string[]> {
  const techStack = [];
  const projectRoot = process.cwd();

  // 检测技术栈
  if (await fs.pathExists(path.join(projectRoot, 'package.json'))) {
    const pkg = await fs.readJson(path.join(projectRoot, 'package.json'));
    
    if (pkg.dependencies) {
      if (pkg.dependencies.react) techStack.push('React');
      if (pkg.dependencies.vue) techStack.push('Vue');
      if (pkg.dependencies.fastify) techStack.push('Fastify');
      if (pkg.dependencies.express) techStack.push('Express');
      if (pkg.dependencies.typescript) techStack.push('TypeScript');
      if (pkg.dependencies.vitest) techStack.push('Vitest');
      if (pkg.dependencies.jest) techStack.push('Jest');
    }
  }

  // 检测配置文件
  const configFiles = [
    { file: 'tsconfig.json', tech: 'TypeScript' },
    { file: 'vite.config.ts', tech: 'Vite' },
    { file: 'webpack.config.js', tech: 'Webpack' },
    { file: 'tailwind.config.js', tech: 'Tailwind' },
    { file: '.eslintrc.js', tech: 'ESLint' },
    { file: 'prettier.config.js', tech: 'Prettier' }
  ];

  for (const { file, tech } of configFiles) {
    if (await fs.pathExists(path.join(projectRoot, file))) {
      techStack.push(tech);
    }
  }

  return [...new Set(techStack)];
}

async function detectFeatures(): Promise<string[]> {
  const features = [];
  const projectRoot = process.cwd();

  // 检测功能特性
  if (await fs.pathExists(path.join(projectRoot, 'tests'))) features.push('Testing');
  if (await fs.pathExists(path.join(projectRoot, 'src'))) features.push('Modular Structure');
  if (await fs.pathExists(path.join(projectRoot, 'docker-compose.yml'))) features.push('Docker Support');
  if (await fs.pathExists(path.join(projectRoot, '.github/workflows'))) features.push('CI/CD');
  if (await fs.pathExists(path.join(projectRoot, 'docs'))) features.push('Documentation');

  return features;
}

async function generateProjectStructure(): Promise<any> {
  const structure: any = { name: 'project', type: 'directory', children: [] };
  const projectRoot = process.cwd();
  
  async function buildTree(dirPath: string, tree: any) {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === 'dist') continue;
      
      const itemPath = path.join(dirPath, item.name);
      const relativePath = path.relative(projectRoot, itemPath);
      
      if (item.isDirectory()) {
        const child = { name: item.name, type: 'directory', children: [] };
        tree.children.push(child);
        await buildTree(itemPath, child);
      } else {
        tree.children.push({ name: item.name, type: 'file', path: relativePath });
      }
    }
  }

  await buildTree(projectRoot, structure);
  return structure;
}

async function countTotalLines(includePatterns: string[], excludePatterns: string[]): Promise<number> {
  let totalLines = 0;
  const files = await glob(includePatterns, { ignore: excludePatterns, cwd: process.cwd() });
  
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      totalLines += content.split('\n').length;
    } catch {}
  }
  
  return totalLines;
}