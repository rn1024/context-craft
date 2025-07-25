# Context-Craft

A powerful MCP (Model Context Protocol) server that provides intelligent code scaffolding, semantic search, and code snippet management with integrated sequential thinking capabilities.

## 🚀 Features

- **🧠 Intelligent Code Generation**: Generate complete project scaffolding for web APIs, microservices, frontend components, and CLI tools
- **🔍 Semantic Code Search**: Search across your codebase with intelligent context understanding
- **💾 Code Snippet Management**: Save, manage, and reuse code templates with variable substitution
- **🎯 Sequential Thinking**: Built-in business context analysis powered by official sequential thinking
- **🔧 Development Tools**: Integrated linting, testing, and project templating
- **📦 Zero Config**: Works out of the box with npx deployment

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `scaffold` | Generate complete project scaffolding for web APIs, microservices, frontend components, or CLI tools |
| `codeSearch` | Perform semantic search across your codebase with context-aware results |
| `lintFix` | Run ESLint with automatic fixes on your codebase |
| `runTests` | Execute test suites using Vitest or Jest |
| `saveContextTemplate` | Save current project structure as reusable template |
| `saveSnippet` | Save selected code as reusable template with variables |
| `insertSnippet` | Insert saved code snippets with variable substitution |
| `listSnippets` | List and search all saved code snippets |

## 📦 Installation

### Using npx (Recommended)
```bash
npx context-craft
```

### Global Installation
```bash
npm install -g context-craft
context-craft
```

### Development Setup
```bash
git clone https://github.com/rn1024/context-craft.git
cd context-craft
npm install
npm run build
npm start
```

## 🔧 Usage

### 1. Code Snippets

#### Save a Code Snippet
```json
@context-craft saveSnippet {
  "name": "react-hook",
  "description": "Reusable React hook template",
  "code": "export const use{{HookName}} = ({{initialValue}}: {{ValueType}}) => {\n  const [{{stateName}}, set{{StateName}}] = useState\u003c{{ValueType}}\u003e({{initialValue}});\n  return { {{stateName}}, set{{StateName}} };\n};",
  "language": "typescript",
  "tags": ["react", "hook", "typescript"],
  "variables": [
    {"name": "HookName", "description": "Hook name", "required": true},
    {"name": "initialValue", "description": "Initial state value", "required": true},
    {"name": "ValueType", "description": "State type", "defaultValue": "string", "required": false},
    {"name": "stateName", "description": "State variable name", "defaultValue": "value", "required": false}
  ]
}
```

#### Insert a Snippet
```json
@context-craft insertSnippet {
  "name": "react-hook",
  "variables": {
    "HookName": "Counter",
    "initialValue": "0",
    "ValueType": "number",
    "stateName": "count"
  }
}
```

### 2. Project Scaffolding

#### Generate a Web API
```json
@context-craft scaffold {
  "type": "web-api",
  "name": "my-api",
  "lang": "ts",
  "features": ["auth", "validation", "swagger"]
}
```

#### Generate a Microservice
```json
@context-craft scaffold {
  "type": "microservice",
  "name": "user-service",
  "lang": "ts",
  "features": ["database", "cache", "monitoring"]
}
```

### 3. Code Search

```json
@context-craft codeSearch {
  "query": "async function",
  "fileTypes": [".ts", ".tsx"],
  "maxResults": 10
}
```

### 4. Project Templates

#### Save Current Project as Template
```json
@context-craft saveContextTemplate {
  "name": "my-project-template",
  "description": "My standard TypeScript project setup",
  "tags": ["typescript", "react", "vitest"]
}
```

## 📁 Data Structure

### Code Snippets
```
templates/snippets/
├── snippet-name/
│   ├── snippet.json     # Metadata and variables
│   ├── template.code    # Template code
│   ├── example.ts       # Usage example
│   └── quick-insert.json # Quick insertion config
```

### Project Templates
```
templates/saved/
├── project-template/
│   ├── template.json    # Project metadata
│   ├── structure.json   # Project structure
│   └── ...              # All project files
```

### Generated Projects
```
generated/
├── project-name/
│   ├── package.json
│   ├── src/
│   ├── tests/
│   └── ...
```

## 🎯 Configuration

### Environment Variables
- `LOG_LEVEL`: Set logging level (debug, info, warn, error)
- `TEMPLATE_PATH`: Custom template directory path

### Template Variables
All templates support Handlebars.js syntax with these built-in helpers:
- `{{name}}` - Project/component name
- `{{PascalName}}` - PascalCase name
- `{{kebabName}}` - kebab-case name
- `{{lang}}` - Language (ts/js)

## 🤖 MCP Integration

### Cursor
Add to your Cursor MCP settings:
```json
{
  "mcpServers": {
    "context-craft": {
      "command": "npx",
      "args": ["context-craft"]
    }
  }
}
```

### Claude Desktop
Add to your Claude Desktop config:
```json
{
  "mcpServers": {
    "context-craft": {
      "command": "npx",
      "args": ["context-craft"]
    }
  }
}
```

## 🧪 Development

### Setup Development Environment
```bash
# Clone repository
git clone https://github.com/rn1024/context-craft.git
cd context-craft

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Project Structure
```
src/
├── index.ts              # Main server entry
├── tools/                # MCP tools
│   ├── scaffold.ts       # Code scaffolding
│   ├── code-search.ts    # Semantic search
│   ├── save-snippet.ts   # Save code snippets
│   ├── insert-snippet.ts # Insert snippets
│   ├── list-snippets.ts  # List snippets
│   └── ...
├── services/
│   └── thinking-engine.ts # Internal sequential thinking
├── utils/
│   └── logger.ts         # Logging utilities
templates/
├── web-api/              # Web API templates
├── microservice/         # Microservice templates
├── frontend-comp/        # Frontend component templates
├── cli/                  # CLI tool templates
└── snippets/             # Saved code snippets
```

## 🚀 Examples

### Quick Start
1. **Generate a new API service**:
   ```json
   @context-craft scaffold {"type": "web-api", "name": "todo-api"}
   ```

2. **Save a frequently used function**:
   ```json
   @context-craft saveSnippet {"name": "api-client", "code": "const api = axios.create({ baseURL: '{{baseUrl}}' });"}
   ```

3. **Search for patterns**:
   ```json
   @context-craft codeSearch {"query": "validation middleware"}
   ```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Create a Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/rn1024/context-craft/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rn1024/context-craft/discussions)

## 🔄 Changelog

### v1.0.0
- Initial release
- 8 MCP tools implemented
- Code snippet management
- Project scaffolding
- Semantic code search
- Template system with variables
- Zero-config deployment

---

**Made with ❤️ for the MCP ecosystem**