#!/usr/bin/env node

import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

console.log('🚀 Context-Craft 交互式测试');
console.log('==========================\n');

// 检查服务器状态
console.log('1️⃣ 检查服务器构建状态...');
if (fs.existsSync('dist/index.js')) {
  console.log('✅ dist/index.js 已存在');
} else {
  console.log('❌ 需要运行 npm run build');
  process.exit(1);
}

// 检查模板目录
console.log('2️⃣ 检查模板目录结构...');
const dirs = [
  'templates/web-api',
  'templates/microservice', 
  'templates/frontend-comp',
  'templates/cli',
  'templates/snippets'
];

dirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`${exists ? '✅' : '❌'} ${dir}`);
});

// 创建测试用例
console.log('\n3️⃣ 创建测试用例...');
const testSnippet = {
  name: 'hello-world',
  description: '简单的Hello World函数',
  code: 'function {{functionName}}({{name}}) {\n  console.log("Hello, " + {{name}} + "!");\n  return {{name}};\n}',
  language: 'javascript',
  tags: ['test', 'hello'],
  variables: [
    { name: 'functionName', description: '函数名称', required: true },
    { name: 'name', description: '问候对象', defaultValue: 'World', required: false }
  ]
};

console.log('测试用例已准备：');
console.log('📋 保存片段:', testSnippet.name);
console.log('📋 列出片段');
console.log('📋 插入片段');

// 显示数据结构位置
console.log('\n4️⃣ 数据查看位置：');
console.log('   📂 代码片段:   templates/snippets/');
console.log('   📂 项目模板:   templates/saved/');
console.log('   📂 脚手架模板: templates/*/');
console.log('   📂 生成项目:   generated/');

// 显示测试命令
console.log('\n5️⃣ 手动测试命令：');
console.log('\n# 启动服务器：');
console.log('npm start');
console.log('\n# 在另一个终端测试：');
console.log('echo \'{"type":"list_tools"}\' | node dist/index.js');

console.log('\n6️⃣ 快速验证步骤：');
console.log('1. 运行: npm start');
console.log('2. 在 Cursor 中添加 MCP 服务器');
console.log('3. 测试 @context-craft listSnippets');
console.log('4. 测试 @context-craft saveSnippet');
console.log('5. 检查 templates/snippets/ 目录');

console.log('\n🎯 验收标准：');
console.log('✅ 8 个工具全部可用');
console.log('✅ 代码片段能保存和插入');
console.log('✅ 数据文件正确保存');
console.log('✅ 变量替换功能正常');

console.log('\n🎉 测试准备完成！');
console.log('📖 详细指南: test-suite.md');