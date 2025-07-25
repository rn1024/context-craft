# Context-Craft MCP 测试验收指南

## 📋 测试环境准备

### 启动服务器
```bash
cd context-craft
npm run build
npm start
```

### 检查工具列表
```json
// 发送给 MCP 服务器
{"type":"list_tools"}
```

预期看到 8 个工具：
- ✅ scaffold
- ✅ codeSearch  
- ✅ lintFix
- ✅ runTests
- ✅ saveContextTemplate
- ✅ saveSnippet
- ✅ insertSnippet
- ✅ listSnippets

## 🎯 核心功能测试

### 1. 代码片段功能测试

#### 保存代码片段
```json
@context-craft saveSnippet {
  "name": "test-function",
  "description": "测试用的函数模板",
  "code": "function {{functionName}}({{param1}}: {{paramType}}) {\n  return {{param1}} * 2;\n}",
  "language": "typescript",
  "tags": ["test", "function"],
  "variables": [
    {"name": "functionName", "description": "函数名称", "required": true},
    {"name": "param1", "description": "参数名称", "defaultValue": "value", "required": false},
    {"name": "paramType", "description": "参数类型", "defaultValue": "number", "required": false}
  ]
}
```

#### 查看保存的数据
**位置**: `templates/snippets/test-function/`
- `snippet.json` - 完整元数据
- `template.code` - 模板代码
- `example.ts` - 使用示例
- `quick-insert.json` - 快速插入配置

#### 插入代码片段
```json
@context-craft insertSnippet {
  "name": "test-function",
  "variables": {
    "functionName": "doubleValue",
    "param1": "input",
    "paramType": "number"
  }
}
```

#### 列出所有片段
```json
@context-craft listSnippets
```

### 2. 项目模板功能测试

#### 保存当前项目为模板
```json
@context-craft saveContextTemplate {
  "name": "test-project",
  "description": "测试项目模板",
  "includePatterns": ["package.json", "src/**/*"],
  "tags": ["test", "typescript"]
}
```

#### 查看保存的数据
**位置**: `templates/saved/test-project/`
- `template.json` - 项目元数据
- `structure.json` - 项目结构
- 所有包含的文件和目录

### 3. 代码搜索功能测试

#### 搜索代码
```json
@context-craft codeSearch {
  "query": "function",
  "fileTypes": [".ts"],
  "maxResults": 5
}
```

### 4. 脚手架功能测试

#### 生成微服务
```json
@context-craft scaffold {
  "type": "microservice",
  "name": "test-service",
  "lang": "ts",
  "features": ["auth", "validation"]
}
```

#### 查看生成的文件
**位置**: `generated/test-service/`
- 查看生成的文件结构和内容

## 📁 数据查看位置

### 1. 代码片段数据
```
templates/snippets/
├── snippet-name/
│   ├── snippet.json     # 元数据
│   ├── template.code    # 模板代码
│   ├── example.ts       # 使用示例
│   └── quick-insert.json # 快速配置
```

### 2. 项目模板数据
```
templates/saved/
├── project-name/
│   ├── template.json    # 项目元数据
│   ├── structure.json   # 项目结构
│   └── ...所有文件...
```

### 3. 脚手架模板数据
```
templates/
├── web-api/          # Web API 模板
├── microservice/     # 微服务模板  
├── frontend-comp/    # 前端组件模板
├── cli/             # CLI 工具模板
```

### 4. 生成的项目
```
generated/
├── project-name/     # 生成的项目
```

## 🔍 验证数据完整性

### 检查文件内容
```bash
# 查看代码片段
ls -la templates/snippets/
cat templates/snippets/test-function/snippet.json

# 查看项目模板
ls -la templates/saved/
cat templates/saved/test-project/template.json

# 查看生成的项目
ls -la generated/
```

### 验证变量替换
```bash
# 测试变量替换
node -e "
const fs = require('fs');
const snippet = JSON.parse(fs.readFileSync('templates/snippets/test-function/snippet.json', 'utf8'));
console.log('Variables:', snippet.variables);
console.log('Template:', snippet.template.code);
"
```

## 🚨 常见问题和调试

### 1. 权限问题
```bash
# 检查目录权限
ls -la templates/
chmod -R 755 templates/
```

### 2. 依赖检查
```bash
npm ls @modelcontextprotocol/sdk
npm ls handlebars
```

### 3. 日志查看
```bash
# 服务器日志在终端输出
# 错误信息会显示具体原因
```

## ✅ 验收标准

### 必须通过的测试
- [ ] 所有 8 个工具都能正常调用
- [ ] 代码片段能保存、列出、插入
- [ ] 项目模板能保存和查看
- [ ] 脚手架能生成完整项目
- [ ] 数据文件正确保存在指定位置
- [ ] 变量替换功能正常工作
- [ ] 搜索功能返回预期结果

### 性能验收
- [ ] 服务器启动时间 < 5秒
- [ ] 工具响应时间 < 3秒
- [ ] 模板渲染速度 < 2秒