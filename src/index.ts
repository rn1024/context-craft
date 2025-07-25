#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { scaffoldTool } from './tools/scaffold.js';
import { codeSearchTool } from './tools/code-search.js';
import { lintFixTool } from './tools/lint-fix.js';
import { runTestsTool } from './tools/run-tests.js';
import { saveContextTemplateTool } from './tools/save-context.js';
import { saveSnippetTool } from './tools/save-snippet.js';
import { insertSnippetTool } from './tools/insert-snippet.js';
import { listSnippetsTool } from './tools/list-snippets.js';
import { ThinkingEngine } from './services/thinking-engine.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('context-craft');

// 创建MCP服务器
const server = new Server(
  {
    name: 'context-craft',
    version: '1.0.0',
    description: 'Business semantic context orchestrator with sequential thinking and code scaffolding',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 内部思考引擎
const thinkingEngine = new ThinkingEngine();

// 所有工具定义（8个对外工具）
const tools = [
  scaffoldTool,
  codeSearchTool,
  lintFixTool,
  runTestsTool,
  saveContextTemplateTool,
  saveSnippetTool,
  insertSnippetTool,
  listSnippetsTool,
];

// 工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  })),
}));

// 工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find(t => t.name === request.params.name);
  if (!tool) {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  logger.info(`Invoking tool: ${request.params.name}`, request.params.arguments);

  try {
    // 所有工具都使用内部思考引擎
    const thinkingEngine = new ThinkingEngine();
    await thinkingEngine.processWithContext(request.params.name, request.params.arguments);
    
    return await tool.invoke(request.params.arguments);
  } catch (error) {
    logger.error(`Error invoking tool ${request.params.name}:`, error);
    throw error;
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Context Craft MCP Server started successfully');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { server };