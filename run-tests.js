#!/usr/bin/env node

import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

const testCases = [
  {
    name: "工具列表测试",
    command: "echo '{\"type\":\"list_tools\"}' | node dist/index.js",
    check: (output) => output.includes('saveSnippet') && output.includes('insertSnippet')
  },
  {
    name: "保存代码片段测试",
    command: `echo '{"type":"call_tool","params":{"name":"saveSnippet","arguments":{"name":"test-hook","description":"测试React Hook","code":"const [{{state}}, set{{State}}] = useState({{initial}});","language":"typescript","tags":["test"]}}}' | node dist/index.js`,
    check: (output) => output.includes('✅') && output.includes('test-hook')
  },
  {
    name: "列出代码片段测试", 
    command: `echo '{"type":"call_tool","params":{"name":"listSnippets","arguments":{}}}' | node dist/index.js`,
    check: (output) => output.includes('test-hook')
  }
];

async function runTest(test) {
  console.log(`🧪 测试: ${test.name}`);
  
  return new Promise((resolve) => {
    const child = spawn('bash', ['-c', test.command], { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      const passed = test.check(output);
      console.log(`${passed ? '✅' : '❌'} ${test.name}: ${passed ? '通过' : '失败'}`);
      
      if (!passed) {
        console.log('输出:', output);
      }
      resolve(passed);
    });
  });
}

async function checkDataFiles() {
  console.log('\n📁 检查数据文件:');
  
  const checks = [
    {
      path: 'templates/snippets/test-hook/snippet.json',
      description: '代码片段元数据'
    },
    {
      path: 'templates/snippets/test-hook/template.code',
      description: '模板代码文件'
    }
  ];
  
  for (const check of checks) {
    const exists = await fs.pathExists(check.path);
    console.log(`${exists ? '✅' : '❌'} ${check.description}: ${check.path}`);
    
    if (exists) {
      try {
        const content = await fs.readJson(check.path);
        console.log(`   🔍 包含: ${content.name}, ${content.language}, ${content.tags?.join(', ')}`);
      } catch (e) {
        // 不是JSON文件
        const content = await fs.readFile(check.path, 'utf8');
        console.log(`   🔍 内容: ${content.substring(0, 50)}...`);
      }
    }
  }
}

async function main() {
  console.log('🚀 Context-Craft 功能测试开始...\n');
  
  // 确保服务器已构建
  if (!await fs.pathExists('dist/index.js')) {
    console.log('❌ 请先运行: npm run build');
    process.exit(1);
  }
  
  let passed = 0;
  let total = testCases.length;
  
  for (const test of testCases) {
    const result = await runTest(test);
    if (result) passed++;
  }
  
  console.log(`\n📊 测试结果: ${passed}/${total} 通过`);
  
  await checkDataFiles();
  
  console.log('\n🎯 数据查看位置:');
  console.log('  📂 代码片段: templates/snippets/');
  console.log('  📂 项目模板: templates/saved/');
  console.log('  📂 生成项目: generated/');
  
  if (passed === total) {
    console.log('\n🎉 所有测试通过！系统运行正常');
  } else {
    console.log('\n⚠️  部分测试失败，请检查输出');
  }
}

main().catch(console.error);